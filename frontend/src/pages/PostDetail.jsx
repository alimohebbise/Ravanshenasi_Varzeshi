import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import client from '../api/client'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    client.get(`/posts/${id}/`)
      .then(({ data }) => {
        setPost(data)
        return client.post(`/posts/${id}/view/`).catch(() => {})
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="sp-loading" style={{ marginTop: 'var(--navbar-h)' }}>
        <div className="sp-spinner" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="container text-center py-5" style={{ marginTop: 'calc(var(--navbar-h) + 2rem)' }} dir="rtl">
        <div className="sp-empty">
          <div className="sp-empty-icon"><i className="bi bi-journal-x" /></div>
          <p>پست یافت نشد.</p>
          <Link to="/posts" className="btn btn-dark">بازگشت به پست‌ها</Link>
        </div>
      </div>
    )
  }

  return (
    <main className="container py-5" style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <Link to="/posts" className="d-inline-flex align-items-center gap-2 mb-4" style={{ color: 'var(--clr-accent)', textDecoration: 'none' }}>
        <i className="bi bi-arrow-right" />
        بازگشت به پست‌ها
      </Link>

      <article className="sp-card p-4 p-md-5" style={{ maxWidth: 860, margin: '0 auto' }}>
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            style={{ width: '100%', maxHeight: 430, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}
          />
        )}
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, lineHeight: 1.5, marginBottom: '.75rem' }}>
          {post.title}
        </h1>
        <div className="d-flex flex-wrap gap-3 mb-4" style={{ color: 'var(--clr-text-muted)', fontSize: '.85rem' }}>
          {post.coach_name && (
            <Link to={`/coaches/${post.coach_id}`} style={{ color: 'var(--clr-accent)', textDecoration: 'none' }}>
              <i className="bi bi-person-badge me-1" />{post.coach_name}
            </Link>
          )}
          <span><i className="bi bi-calendar3 me-1" />{new Date(post.created_at).toLocaleDateString('fa-IR')}</span>
          <span><i className="bi bi-eye me-1" />{post.view_count.toLocaleString('fa-IR')} بازدید</span>
        </div>
        <div className="sp-rich-content" style={{ lineHeight: '2', color: 'var(--clr-text)', fontSize: '1rem' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
      </article>
    </main>
  )
}
