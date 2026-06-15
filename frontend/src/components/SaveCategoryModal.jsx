import { useEffect, useState } from 'react'
import client from '../api/client'

export default function SaveCategoryModal({ postId, isSaved, categoryId, onClose, onChange }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    client.get('/posts/save-categories/')
      .then(({ data }) => setCategories(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function selectCategory(targetCategoryId) {
    if (busy) return
    setBusy(true)
    try {
      const { data } = await client.post(`/posts/${postId}/save/`, { category_id: targetCategoryId })
      onChange(data)
      onClose()
    } catch {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      const { data: category } = await client.post('/posts/save-categories/', { name })
      setCategories((c) => (c.some((x) => x.id === category.id) ? c : [...c, category]))
      setNewName('')
      await selectCategory(category.id)
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="sp-modal-overlay" onClick={onClose} dir="rtl">
      <div className="sp-modal-box" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <button className="sp-modal-close" onClick={onClose} aria-label="بستن">
          <i className="bi bi-x" />
        </button>

        <div className="sp-modal-header">
          <div className="sp-modal-icon">
            <i className="bi bi-bookmark-fill" />
          </div>
          <h5>ذخیره پست</h5>
          <p>یک دسته‌بندی انتخاب کنید، یا دسته‌بندی جدید بسازید</p>
        </div>

        {loading ? (
          <div className="sp-comments-empty">در حال بارگذاری...</div>
        ) : (
          <div className="sp-save-categories-list">
            <button
              type="button"
              className={`sp-save-category-item ${isSaved && categoryId == null ? 'active' : ''}`}
              disabled={busy}
              onClick={() => selectCategory(null)}
            >
              <i className="bi bi-bookmark" />
              <span>بدون دسته‌بندی</span>
              {isSaved && categoryId == null && <i className="bi bi-check2-circle ms-auto" />}
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`sp-save-category-item ${isSaved && categoryId === cat.id ? 'active' : ''}`}
                disabled={busy}
                onClick={() => selectCategory(cat.id)}
              >
                <i className="bi bi-folder" />
                <span>{cat.name}</span>
                <span className="sp-save-category-count">{cat.post_count}</span>
                {isSaved && categoryId === cat.id && <i className="bi bi-check2-circle" />}
              </button>
            ))}
          </div>
        )}

        <form className="sp-save-new-category" onSubmit={handleCreate}>
          <input
            className="form-control"
            placeholder="ساخت دسته‌بندی جدید..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={busy}
          />
          <button className="btn btn-dark" disabled={busy || !newName.trim()} aria-label="ساخت">
            <i className="bi bi-plus-lg" />
          </button>
        </form>

        {isSaved && (
          <p className="sp-save-hint">
            برای حذف از ذخیره‌شده‌ها، روی دسته‌بندی فعلی دوباره کلیک کنید.
          </p>
        )}
      </div>
    </div>
  )
}
