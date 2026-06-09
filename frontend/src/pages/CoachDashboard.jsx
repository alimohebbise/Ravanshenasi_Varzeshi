import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const STATUS_BADGE = {
  published: 'success',
  draft: 'secondary',
}

const emptyForm = { title: '', content: '', status: 'draft', cover_image: null }

export default function CoachDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null) // post object or null (= create)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.role !== 'coach' && user.role !== 'owner') {
      navigate('/fa/articles')
    }
  }, [user, navigate])

  const loadPosts = useCallback(() => {
    setLoading(true)
    client.get('/posts/my/')
      .then(({ data }) => setPosts(data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(post) {
    setEditing(post)
    setForm({ title: post.title, content: post.content, status: post.status, cover_image: null })
    setError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      fd.append('status', form.status)
      if (form.cover_image) fd.append('cover_image', form.cover_image)

      if (editing) {
        await client.patch(`/posts/${editing.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await client.post('/posts/create/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setShowModal(false)
      loadPosts()
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'خطا رخ داد')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(post) {
    if (!window.confirm(`پست "${post.title}" حذف شود؟`)) return
    await client.delete(`/posts/${post.id}/`)
    loadPosts()
  }

  const totalViews = posts.filter(p => p.status === 'published').reduce((s, p) => s + p.view_count, 0)
  const publishedPosts = posts.filter(p => p.status === 'published')

  if (!user || (user.role !== 'coach' && user.role !== 'owner')) return null

  return (
    <div className="container py-4" style={{ marginTop: '70px' }} dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">داشبورد مربی</h3>
        <button className="btn btn-primary" onClick={openCreate}>+ پست جدید</button>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
            مقالات من
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
            آمار بازدید
          </button>
        </li>
      </ul>

      {tab === 'posts' && (
        loading ? (
          <div className="text-center py-5"><div className="spinner-border" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted py-5">
            <p>هنوز پستی ندارید.</p>
            <button className="btn btn-primary" onClick={openCreate}>اولین پست را بنویسید</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>عنوان</th>
                  <th>وضعیت</th>
                  <th>بازدید</th>
                  <th>تاریخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id}>
                    <td className="fw-semibold">{post.title}</td>
                    <td>
                      <span className={`badge bg-${STATUS_BADGE[post.status]}`}>
                        {post.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </td>
                    <td>{post.view_count.toLocaleString('fa-IR')}</td>
                    <td className="text-muted small">
                      {new Date(post.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(post)}>
                          ویرایش
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(post)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'stats' && (
        <div>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card text-center p-3">
                <div className="fs-2 fw-bold text-primary">{totalViews.toLocaleString('fa-IR')}</div>
                <div className="text-muted small">کل بازدیدها</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center p-3">
                <div className="fs-2 fw-bold text-success">{publishedPosts.length}</div>
                <div className="text-muted small">پست منتشر شده</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card text-center p-3">
                <div className="fs-2 fw-bold text-secondary">{posts.length - publishedPosts.length}</div>
                <div className="text-muted small">پیش‌نویس</div>
              </div>
            </div>
          </div>

          {publishedPosts.length > 0 && (
            <>
              <h5 className="mb-3">بازدید هر پست</h5>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>عنوان پست</th>
                      <th>بازدید</th>
                      <th style={{ minWidth: '200px' }}>نمودار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...publishedPosts]
                      .sort((a, b) => b.view_count - a.view_count)
                      .map(post => {
                        const max = Math.max(...publishedPosts.map(p => p.view_count), 1)
                        const pct = Math.round((post.view_count / max) * 100)
                        return (
                          <tr key={post.id}>
                            <td>{post.title}</td>
                            <td className="fw-bold">{post.view_count.toLocaleString('fa-IR')}</td>
                            <td>
                              <div className="progress" style={{ height: '12px' }}>
                                <div
                                  className="progress-bar bg-primary"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }} dir="rtl">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'ویرایش پست' : 'پست جدید'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label">عنوان</label>
                    <input
                      className="form-control"
                      required
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">محتوا</label>
                    <textarea
                      className="form-control"
                      rows={10}
                      required
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">تصویر بارگذاری (اختیاری)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={e => setForm(f => ({ ...f, cover_image: e.target.files[0] || null }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">وضعیت</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="draft">پیش‌نویس</option>
                      <option value="published">منتشر شده</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    انصراف
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'در حال ذخیره...' : 'ذخیره'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
