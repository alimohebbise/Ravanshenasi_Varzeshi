import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import client from '../api/client'
import InstaPostCard from '../components/InstaPostCard'

const ANON_VISIBLE_COUNT = 3

export default function PostFeed() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/posts/')
      .then(({ data }) => setPosts(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="sp-loading" style={{ marginTop: 'var(--navbar-h)' }}>
        <div className="sp-spinner" />
      </div>
    )
  }

  const visiblePosts = user ? posts : posts.slice(0, ANON_VISIBLE_COUNT)
  const lockedPost = !user ? posts[ANON_VISIBLE_COUNT] : null

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <div className="sp-page-header">
        <div className="container">
          <h2 className="sp-page-title">پست‌های مربیان</h2>
          <p className="sp-page-subtitle">جدیدترین مطالب، تجربه‌ها و توصیه‌های مربیان را دنبال کنید</p>
        </div>
      </div>

      <div className="container py-4">
        <div className="sp-insta-feed">
          {visiblePosts.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon"><i className="bi bi-journal-x" /></div>
              <p>هنوز پستی منتشر نشده است.</p>
            </div>
          ) : (
            visiblePosts.map((post) => <InstaPostCard key={post.id} post={post} />)
          )}

          {lockedPost && (
            <div className="sp-insta-locked">
              <div className="sp-insta-locked-preview">
                <InstaPostCard post={lockedPost} />
              </div>
              <div className="sp-insta-locked-overlay">
                <i className="bi bi-lock-fill" />
                <p>برای مشاهده پست‌های بیشتر و امکان لایک، ذخیره و ارسال نظر، وارد حساب خود شوید.</p>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" onClick={() => openAuthModal('signup')}>
                    ثبت نام
                  </button>
                  <button className="btn btn-outline-primary" onClick={() => openAuthModal('login')}>
                    ورود
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
