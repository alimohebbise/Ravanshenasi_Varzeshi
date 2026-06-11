import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import { PostCard, PostModal } from '../components/PostCard'

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
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => setActivePost(post)} />
            ))}
          </div>
        )}
      </div>

      <PostModal post={activePost} onClose={() => setActivePost(null)} />
    </div>
  )
}
