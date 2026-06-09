import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'

function PostModal({ post, onClose }) {
  useEffect(() => {
    if (!post) return
    client.post(`/posts/${post.id}/view/`).catch(() => {})
  }, [post])

  if (!post) return null

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.6)' }} onClick={onClose} dir="rtl">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{post.title}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="img-fluid rounded mb-3 w-100"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
              />
            )}
            <p className="text-muted small mb-3">
              {new Date(post.created_at).toLocaleDateString('fa-IR')}
              <span className="ms-3">
                <i className="bi bi-eye me-1" />
                {post.view_count.toLocaleString('fa-IR')} بازدید
              </span>
            </p>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{post.content}</div>
          </div>
        </div>
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
      client.get('/coaches/approved/').catch(() => ({ data: [] })),
      client.get(`/posts/?coach_id=${coachId}`),
    ]).then(([coachesRes, postsRes]) => {
      const found = coachesRes.data.find(c => String(c.user_id) === String(coachId))
      setCoach(found || null)
      setPosts(postsRes.data)
    }).finally(() => setLoading(false))
  }, [coachId])

  if (loading) {
    return (
      <div className="text-center py-5" style={{ marginTop: '80px' }}>
        <div className="spinner-border" />
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="container text-center py-5" style={{ marginTop: '80px' }}>
        <h4>مربی یافت نشد</h4>
        <Link to="/coaches" className="btn btn-outline-secondary mt-3">بازگشت به مربیان</Link>
      </div>
    )
  }

  const totalViews = posts.reduce((s, p) => s + p.view_count, 0)

  return (
    <div className="container py-4" style={{ marginTop: '70px' }} dir="rtl">
      {/* Coach profile header */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold fs-3"
              style={{ width: 72, height: 72, flexShrink: 0 }}
            >
              {coach.first_name?.[0]}{coach.last_name?.[0]}
            </div>
            <div>
              <h3 className="mb-0 fw-bold">{coach.first_name} {coach.last_name}</h3>
              {coach.expertise && <p className="text-muted mb-0">{coach.expertise}</p>}
            </div>
          </div>

          <div className="d-flex gap-4 mb-3 flex-wrap">
            {coach.experience_years > 0 && (
              <span className="text-muted small">
                <i className="bi bi-briefcase me-1" />
                {coach.experience_years} سال تجربه
              </span>
            )}
            <span className="text-muted small">
              <i className="bi bi-file-earmark-text me-1" />
              {posts.length} پست
            </span>
            <span className="text-muted small">
              <i className="bi bi-eye me-1" />
              {totalViews.toLocaleString('fa-IR')} بازدید
            </span>
          </div>

          {coach.bio && <p className="mb-0" style={{ lineHeight: '1.8' }}>{coach.bio}</p>}
        </div>
      </div>

      {/* Published posts */}
      <h5 className="fw-bold mb-3">پست‌های منتشر شده</h5>

      {posts.length === 0 ? (
        <p className="text-muted">هنوز پستی منتشر نشده است.</p>
      ) : (
        <div className="row g-3">
          {posts.map(post => (
            <div key={post.id} className="col-12 col-md-6">
              <div
                className="card h-100 border-0 shadow-sm"
                style={{ cursor: 'pointer' }}
                onClick={() => setActivePost(post)}
              >
                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="card-img-top"
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                )}
                <div className="card-body">
                  <h6 className="card-title fw-bold">{post.title}</h6>
                  <p className="card-text text-muted small" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {post.content}
                  </p>
                </div>
                <div className="card-footer bg-white border-0 d-flex justify-content-between text-muted small">
                  <span>{new Date(post.created_at).toLocaleDateString('fa-IR')}</span>
                  <span>
                    <i className="bi bi-eye me-1" />
                    {post.view_count.toLocaleString('fa-IR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PostModal post={activePost} onClose={() => setActivePost(null)} />
    </div>
  )
}
