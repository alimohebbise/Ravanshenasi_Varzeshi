import { useMemo, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import client from '../api/client'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg']

export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null)

  function imageHandler() {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', '.png,.jpg,.jpeg,image/png,image/jpeg')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert('فقط تصاویر PNG و JPG مجاز هستند.')
        return
      }

      const editor = quillRef.current?.getEditor()
      const range = editor?.getSelection(true)

      try {
        const fd = new FormData()
        fd.append('image', file)
        const { data } = await client.post('/posts/upload-image/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        editor.insertEmbed(range?.index ?? 0, 'image', data.url, 'user')
        editor.setSelection((range?.index ?? 0) + 1)
      } catch (err) {
        alert(err.response?.data?.error || 'بارگذاری تصویر با خطا مواجه شد.')
      }
    }
  }

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote', 'link', 'image'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  }), [])

  return (
    <div className="sp-rte">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  )
}
