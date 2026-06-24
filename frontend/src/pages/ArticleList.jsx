import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import client from '../api/client'

export default function ArticleList() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [posts, setPosts] = useState([])

  useEffect(() => {
    client.get('/posts/')
      .then(({ data }) => setPosts(data))
      .catch(() => {})
  }, [])

  const totalPosts = posts.length
  const totalViews = posts.reduce((s, p) => s + p.view_count, 0)
  const coachCount = new Set(posts.map((p) => p.coach_id)).size

  return (
    <div dir="rtl">
      {/* ── Hero ── */}
      <section className="sp-hero">
        <div className="container sp-hero-content">
          <div className="sp-hero-eyebrow">
            <i className="bi bi-award-fill" />
            متخصص روانشناسی ورزشی ما
          </div>
          <h1>
            <span>روانشناسی</span> ورزشی
          </h1>
          <p className="sp-hero-sub">
            مجموعه‌ای جامع از مقالات علمی در حوزه روانشناسی و فیزیولوژی ورزش، مربیگری و هنرهای رزمی
          </p>

          {!user && (
            <div className="sp-hero-actions">
              <button
                className="btn btn-primary px-4 py-2"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                onClick={() => openAuthModal('signup')}
              >
                <i className="bi bi-person-plus me-2" />
                ثبت نام
              </button>
              <button
                className="btn btn-nav-login px-4 py-2"
                style={{ borderRadius: 'var(--radius-md)' }}
                onClick={() => openAuthModal('login')}
              >
                <i className="bi bi-box-arrow-in-right me-2" />
                ورود
              </button>
            </div>
          )}

          <div className="sp-hero-stats">
            <div>
              <div className="sp-hero-stat-value">{totalPosts}</div>
              <div className="sp-hero-stat-label">پست</div>
            </div>
            <div>
              <div className="sp-hero-stat-value">{coachCount}</div>
              <div className="sp-hero-stat-label">مربی</div>
            </div>
            <div>
              <div className="sp-hero-stat-value">
                {totalViews.toLocaleString('fa-IR')}
              </div>
              <div className="sp-hero-stat-label">کل بازدید</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
