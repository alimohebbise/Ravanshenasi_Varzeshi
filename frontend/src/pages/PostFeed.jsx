import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
        <div className="sp-posts-frame-shell">
          <div className="sp-posts-frame-panel sp-posts-frame-panel-empty" aria-hidden="true" />

          <div className="sp-posts-frame-panel sp-posts-frame-panel-titles">
            {posts.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon"><i className="bi bi-journal-x" /></div>
                <p>هنوز پستی منتشر نشده است.</p>
              </div>
            ) : (
              <ul className="sp-posts-frame-list">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link to={`/posts/${post.id}`} className="sp-posts-frame-item">
                      <div className="sp-posts-frame-item-title">{post.title}</div>
                      <span className="sp-posts-frame-item-meta">
                        <i className="bi bi-eye me-1" />
                        {Number(post.view_count || 0).toLocaleString('fa-IR')} بازدید
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
