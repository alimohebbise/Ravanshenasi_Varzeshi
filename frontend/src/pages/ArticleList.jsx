import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { PostCard, PostModal } from '../components/PostCard'

export default function ArticleList() {
  const { lang = 'fa' } = useParams()
  const { user } = useAuth()
  const isRtl = lang === 'fa'

  const [posts, setPosts] = useState([])
  const [activePost, setActivePost] = useState(null)

  useEffect(() => {
    client.get('/posts/')
      .then(({ data }) => setPosts(data))
      .catch(() => {})
  }, [])

  const totalPosts = posts.length
  const totalViews = posts.reduce((s, p) => s + p.view_count, 0)
  const coachCount = new Set(posts.map((p) => p.coach_id)).size

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── Hero ── */}
      <section className="sp-hero">
        <div className="container sp-hero-content">
          <div className="sp-hero-eyebrow">
            <i className="bi bi-award-fill" />
            {isRtl ? 'متخصص روانشناسی ورزشی ما' : 'Our Sports Psychologist'}
          </div>
          <h1>
            {isRtl
              ? <><span>روانشناسی</span> ورزشی</>
              : <>Sports <span>Psychology</span></>
            }
          </h1>
          <p className="sp-hero-sub">
            {isRtl
              ? 'مجموعه‌ای جامع از مقالات علمی در حوزه روانشناسی و فیزیولوژی ورزش، مربیگری و هنرهای رزمی'
              : 'A comprehensive collection of scientific articles on sport psychology, physiology, coaching, and martial arts'
            }
          </p>

          {!user && (
            <div className="sp-hero-actions">
              <button
                className="btn btn-primary px-4 py-2"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                onClick={() => document.querySelector('.btn-nav-signup')?.click()}
              >
                <i className="bi bi-person-plus me-2" />
                {isRtl ? 'ثبت نام' : 'Sign Up'}
              </button>
              <button
                className="btn btn-nav-login px-4 py-2"
                style={{ borderRadius: 'var(--radius-md)' }}
                onClick={() => document.querySelector('.btn-nav-login')?.click()}
              >
                <i className="bi bi-box-arrow-in-right me-2" />
                {isRtl ? 'ورود' : 'Login'}
              </button>
            </div>
          )}

          <div className="sp-hero-stats">
            <div>
              <div className="sp-hero-stat-value">{totalPosts}</div>
              <div className="sp-hero-stat-label">{isRtl ? 'پست' : 'Posts'}</div>
            </div>
            <div>
              <div className="sp-hero-stat-value">{coachCount}</div>
              <div className="sp-hero-stat-label">{isRtl ? 'مربی' : 'Coaches'}</div>
            </div>
            <div>
              <div className="sp-hero-stat-value">
                {totalViews.toLocaleString(isRtl ? 'fa-IR' : 'en')}
              </div>
              <div className="sp-hero-stat-label">{isRtl ? 'کل بازدید' : 'Total Views'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Coach posts ── */}
      {posts.length > 0 && (
        <div className="container py-4" dir="rtl">
          <h5 className="sp-section-title">
            {isRtl ? 'آخرین پست‌های مربیان' : 'Latest Coach Posts'}
          </h5>
          <div className="row g-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => setActivePost(post)} showCoach />
            ))}
          </div>
        </div>
      )}

      <PostModal post={activePost} onClose={() => setActivePost(null)} />
    </div>
  )
}
