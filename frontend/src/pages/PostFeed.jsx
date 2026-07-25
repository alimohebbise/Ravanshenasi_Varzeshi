import { useEffect, useState } from 'react'
import client from '../api/client'
import InstaPostCard from '../components/InstaPostCard'

export default function PostFeed() {
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
          {posts.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon"><i className="bi bi-journal-x" /></div>
              <p>هنوز پستی منتشر نشده است.</p>
            </div>
          ) : (
            posts.map((post) => <InstaPostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  )
}
