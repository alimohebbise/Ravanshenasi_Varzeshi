import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import client from '../api/client'

function stripHtml(html) {
  const withBreaks = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
  const div = document.createElement('div')
  div.innerHTML = withBreaks
  return (div.textContent || '').replace(/\s+/g, ' ').trim()
}

function getThumbnail(post) {
  if (post.cover_image) return post.cover_image
  const match = post.content.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

function PostModal({ post, onClose }) {
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

export default function CoachPage() {
  const { coachId } = useParams()
  const [coach, setCoach] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePost, setActivePost] = useState(null)

  useEffect(() => {
    Promise.all([
      client.get(`/coaches/${coachId}/profile/`).catch(() => ({ data: null })),
      client.get(`/posts/?coach_id=${coachId}`).catch(() => ({ data: [] })),
    ]).then(([coachRes, postsRes]) => {
      setCoach(coachRes.data)
      setPosts(postsRes.data)
    }).finally(() => setLoading(false))
  }, [coachId])

  if (loading) return (
    <div className="sp-loading" style={{ marginTop: 'var(--navbar-h)' }}>
      <div className="sp-spinner" />
    </div>
  )

  if (!coach) return (
    <div className="container text-center py-5" style={{ marginTop: 'calc(var(--navbar-h) + 2rem)' }} dir="rtl">
      <div className="sp-empty">
        <div className="sp-empty-icon"><i className="bi bi-person-x" /></div>
        <p>مربی یافت نشد.</p>
        <Link to="/coaches" className="btn btn-dark">بازگشت به مربیان</Link>
      </div>
    </div>
  )

  const totalViews = posts.reduce((s, p) => s + p.view_count, 0)

  return (
    <div>
      {/* Coach hero */}
      <div className="sp-coach-hero">
        <div className="container" dir="rtl">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <div className="sp-coach-avatar lg">{coach.first_name?.[0]}{coach.last_name?.[0]}</div>
            <div className="flex-grow-1">
              <h2 style={{ color: '#fff', margin: '0 0 .3rem', fontWeight: 800 }}>
                {coach.first_name} {coach.last_name}
              </h2>
              {coach.expertise && (
                <p style={{ color: 'rgba(255,255,255,.6)', margin: 0, fontSize: '.95rem' }}>
                  {coach.expertise}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="d-flex flex-wrap mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,.1)', gap: '0' }}>
            <div className="sp-coach-hero-stat">
              <div className="sp-coach-hero-stat-val">{posts.length}</div>
              <div className="sp-coach-hero-stat-lbl">پست</div>
            </div>
            <div className="sp-coach-hero-stat">
              <div className="sp-coach-hero-stat-val">{totalViews.toLocaleString('fa-IR')}</div>
              <div className="sp-coach-hero-stat-lbl">بازدید</div>
            </div>
            {coach.experience_years > 0 && (
              <div className="sp-coach-hero-stat">
                <div className="sp-coach-hero-stat-val">{coach.experience_years}</div>
                <div className="sp-coach-hero-stat-lbl">سال تجربه</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-4" dir="rtl">
        {/* Bio */}
        {coach.bio && (
          <div className="sp-card p-4 mb-4">
            <div className="form-section-title">درباره مربی</div>
            <p style={{ color: 'var(--clr-text-2)', lineHeight: '1.9', margin: 0 }}>{coach.bio}</p>
          </div>
        )}

        {/* Posts */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="sp-section-title mb-0">پست‌های منتشر شده</h5>
          <span style={{ color: 'var(--clr-text-muted)', fontSize: '.85rem' }}>
            {posts.length} پست
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-journal-x" /></div>
            <p>هنوز پستی منتشر نشده است.</p>
          </div>
        ) : (
          <div className="row g-3">
            {posts.map((post) => {
              const thumb = getThumbnail(post)
              return (
              <div key={post.id} className="col-12 col-md-6">
                <div className="sp-post-card" onClick={() => setActivePost(post)}>
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
            })}
          </div>
        )}
      </div>

      <PostModal post={activePost} onClose={() => setActivePost(null)} />
    </div>
  )
}
