import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'

export default function CommentSection({ postId, onCommentAdded }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    client.get(`/posts/${postId}/comments/`)
      .then(({ data }) => setComments(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [postId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      openAuthModal('login')
      return
    }
    const content = text.trim()
    if (!content) return
    setSubmitting(true)
    try {
      const { data } = await client.post(`/posts/${postId}/comments/`, { content })
      setComments((c) => [...c, data])
      setText('')
      onCommentAdded?.()
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sp-comments">
      {loading ? (
        <div className="sp-comments-empty">در حال بارگذاری نظرات...</div>
      ) : comments.length === 0 ? (
        <div className="sp-comments-empty">هنوز نظری ثبت نشده. اولین نفری باشید که نظر می‌دهید!</div>
      ) : (
        <ul className="sp-comments-list">
          {comments.map((c) => (
            <li key={c.id} className="sp-comment-row">
              <span className="sp-comment-user">{c.user_name}</span>
              <span className="sp-comment-text">{c.content}</span>
            </li>
          ))}
        </ul>
      )}

      <form className="sp-comment-form" onSubmit={handleSubmit}>
        <input
          className="form-control"
          placeholder="نظر خود را بنویسید..."
          value={text}
          readOnly={!user}
          onClick={() => { if (!user) openAuthModal('login') }}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" disabled={submitting || !text.trim()}>
          <i className="bi bi-send" />
        </button>
      </form>
    </div>
  )
}
