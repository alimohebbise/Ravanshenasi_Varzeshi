import { useEffect } from 'react'
import DOMPurify from 'dompurify'
import { Link } from 'react-router-dom'
import client from '../api/client'

export function stripHtml(html) {
  const withBreaks = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
  const div = document.createElement('div')
  div.innerHTML = withBreaks
  return (div.textContent || '').replace(/\s+/g, ' ').trim()
}

export function getThumbnail(post) {
  if (post.cover_image) return post.cover_image
  const match = post.content.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

export function PostModal({ post, onClose }) {
  useEffect(() => {
    if (!post) return
    client.post(`/posts/${post.id}/view/`).catch(() => {})
  }, [post])

  if (!post) return null

  return (
    <div
      className="sp-modal-overlay"
      onClick={onClose}
      dir="rtl"
      style={{ alignItems: 'flex-start', paddingTop: '5rem' }}
    >
      <div
        className="sp-modal-box"
        style={{ maxWidth: 680, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="sp-modal-close" onClick={onClose} aria-label="بستن">
          <i className="bi bi-x" />
        </button>

        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            style={{
              width: 'calc(100% + 4rem)',
              marginLeft: '-2rem',
              marginRight: '-2rem',
              marginTop: '-2.25rem',
              marginBottom: '1.5rem',
              maxHeight: 260,
              objectFit: 'cover',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            }}
          />
        )}

        <h4 style={{ fontWeight: 800, marginBottom: '.75rem', overflowWrap: 'break-word' }}>{post.title}</h4>

        <div className="d-flex gap-3 mb-3" style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem' }}>
          {post.coach_name && (
            <span><i className="bi bi-person-badge me-1" />{post.coach_name}</span>
          )}
          <span><i className="bi bi-calendar3 me-1" />{new Date(post.created_at).toLocaleDateString('fa-IR')}</span>
          <span><i className="bi bi-eye me-1" />{post.view_count.toLocaleString('fa-IR')} بازدید</span>
        </div>

        <div
          className="sp-rich-content"
          style={{ lineHeight: '1.95', color: 'var(--clr-text)', fontSize: '.95rem' }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />
      </div>
    </div>
  )
}

export function PostCard({ post, onClick, showCoach = false }) {
  const thumb = getThumbnail(post)

  return (
    <div className="col-12 col-md-6">
      <div className="sp-post-card" onClick={onClick}>
        {thumb ? (
          <img
            src={thumb}
            alt={post.title}
            style={{ width: '100%', height: 180, objectFit: 'cover' }}
          />
        ) : (
          <div className="sp-post-card-placeholder">
            <i className="bi bi-journal-richtext" />
          </div>
        )}
        <div className="card-body">
          {showCoach && post.coach_name && (
            <Link
              to={`/coaches/${post.coach_id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                color: 'var(--clr-accent)', fontSize: '.8rem', fontWeight: 600,
                marginBottom: '.4rem', textDecoration: 'none',
              }}
            >
              <i className="bi bi-person-badge" />
              {post.coach_name}
            </Link>
          )}
          <h6 style={{
            fontWeight: 700, marginBottom: '.5rem', color: 'var(--clr-text)',
            overflowWrap: 'break-word',
          }}>
            {post.title}
          </h6>
          <p style={{
            color: 'var(--clr-text-2)', fontSize: '.875rem', lineHeight: '1.6',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', margin: 0,
            overflowWrap: 'break-word',
          }}>
            {stripHtml(post.content)}
          </p>
        </div>
        <div className="card-footer">
          <span style={{ color: 'var(--clr-text-muted)', fontSize: '.78rem' }}>
            <i className="bi bi-calendar3 me-1" />
            {new Date(post.created_at).toLocaleDateString('fa-IR')}
          </span>
          <span className="sp-view-count">
            <i className="bi bi-eye" />
            {post.view_count.toLocaleString('fa-IR')}
          </span>
        </div>
      </div>
    </div>
  )
}
