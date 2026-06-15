import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { PostCard, PostModal } from '../components/PostCard'

export default function SavedPosts() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePost, setActivePost] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/fa/articles'); return }
    client.get('/posts/save-categories/')
      .then(({ data }) => setCategories(data))
      .catch(() => {})
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const params = activeCategory === 'all' ? '' : `?category_id=${activeCategory}`
    client.get(`/posts/saved/${params}`)
      .then(({ data }) => setSavedPosts(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, activeCategory])

  if (authLoading || !user) {
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
          <h2 className="sp-page-title">ذخیره‌شده‌ها</h2>
          <p className="sp-page-subtitle">پست‌هایی که در دسته‌بندی‌های خود ذخیره کرده‌اید</p>
        </div>
      </div>

      <div className="container py-4">
        <div className="sp-filter-wrap">
          <button
            className={`sp-filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            همه
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`sp-filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name} ({cat.post_count.toLocaleString('fa-IR')})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="sp-loading">
            <div className="sp-spinner" />
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-bookmark-x" /></div>
            <p>پستی در این دسته‌بندی ذخیره نشده است.</p>
          </div>
        ) : (
          <div className="row g-3">
            {savedPosts.map((sp) => (
              <PostCard key={sp.id} post={sp.post} onClick={() => setActivePost(sp.post)} showCoach />
            ))}
          </div>
        )}
      </div>

      <PostModal post={activePost} onClose={() => setActivePost(null)} />
    </div>
  )
}
