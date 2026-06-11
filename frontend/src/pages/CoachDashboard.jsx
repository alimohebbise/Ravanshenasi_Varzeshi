import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import RichTextEditor from '../components/RichTextEditor'

const emptyForm = { title: '', content: '', status: 'draft', cover_image: null }

export default function CoachDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isCoach = user?.role === 'coach' || user?.role === 'owner'
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/fa/articles'); return }
    if (!isCoach) navigate('/my-profile')
  }, [user, isCoach, navigate])

  const loadPosts = useCallback(() => {
    setLoading(true)
    client.get('/posts/my/')
      .then(({ data }) => setPosts(data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user || !isCoach) return
    loadPosts()
  }, [user, isCoach, loadPosts])

  function openCreate() {
    setEditing(null); setForm(emptyForm); setError(''); setShowModal(true)
  }

  function openEdit(post) {
    setEditing(post)
    setForm({ title: post.title, content: post.content, status: post.status, cover_image: null })
    setError(''); setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault(); setError('')
    const isContentEmpty = form.content.replace(/<(.|\n)*?>/g, '').trim().length === 0
    if (isContentEmpty) {
      setError('محتوای پست نمی‌تواند خالی باشد.')
      return
    }
    setSaving(true)
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
      setShowModal(false); loadPosts()
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'خطا رخ داد')
    } finally { setSaving(false) }
  }

  async function handleDelete(post) {
    if (!window.confirm(`پست "${post.title}" حذف شود؟`)) return
    await client.delete(`/posts/${post.id}/`)
    loadPosts()
  }

  const publishedPosts = posts.filter((p) => p.status === 'published')
  const draftPosts     = posts.filter((p) => p.status === 'draft')
  const totalViews     = publishedPosts.reduce((s, p) => s + p.view_count, 0)

  if (!user || !isCoach) return null

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }}>
      {/* Header */}
      <div style={{ background: 'var(--clr-navy)', color: '#fff', padding: '2rem 0' }}>
        <div className="container d-flex align-items-center justify-content-between flex-wrap gap-3" dir="rtl">
          <div>
            <h2 style={{ color: '#fff', margin: '0 0 .2rem', fontWeight: 800 }}>داشبورد مربی</h2>
            <p style={{ color: 'rgba(255,255,255,.5)', margin: 0, fontSize: '.88rem' }}>
              مدیریت پست‌های شما
            </p>
          </div>
          <div className="d-flex gap-2">
            {user.role === 'coach' && (
              <Link
                to={`/coaches/${user.id}`}
                className="btn btn-outline-light d-flex align-items-center gap-2"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
              >
                <i className="bi bi-box-arrow-up-left" /> صفحه من
              </Link>
            )}
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
              onClick={openCreate}
            >
              <i className="bi bi-plus-lg" /> پست جدید
            </button>
          </div>
        </div>
      </div>

      <div className="container py-4" dir="rtl">
        {/* Stats row */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4">
            <div className="sp-stat-card">
              <div className="sp-stat-icon blue"><i className="bi bi-eye" /></div>
              <div>
                <div className="sp-stat-val">{totalViews.toLocaleString('fa-IR')}</div>
                <div className="sp-stat-lbl">کل بازدیدها</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="sp-stat-card">
              <div className="sp-stat-icon green"><i className="bi bi-send-check" /></div>
              <div>
                <div className="sp-stat-val">{publishedPosts.length}</div>
                <div className="sp-stat-lbl">منتشر شده</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="sp-stat-card">
              <div className="sp-stat-icon yellow"><i className="bi bi-file-earmark-text" /></div>
              <div>
                <div className="sp-stat-val">{draftPosts.length}</div>
                <div className="sp-stat-lbl">پیش‌نویس</div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {(
          loading ? (
            <div className="sp-loading"><div className="sp-spinner" /></div>
          ) : posts.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon"><i className="bi bi-journal-plus" /></div>
              <p>هنوز پستی ندارید.</p>
              <button className="btn btn-primary" onClick={openCreate}>اولین پست را بنویسید</button>
            </div>
          ) : (
            <div className="sp-table">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>وضعیت</th>
                    <th>بازدید</th>
                    <th>تاریخ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td style={{ fontWeight: 600 }}>{post.title}</td>
                      <td>
                        <span className={`sp-status ${post.status}`}>
                          {post.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                        </span>
                      </td>
                      <td>
                        <span className="sp-view-count">
                          <i className="bi bi-eye" />
                          {post.view_count.toLocaleString('fa-IR')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem' }}>
                        {new Date(post.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: 'var(--radius-sm)' }}
                            onClick={() => openEdit(post)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{ borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleDelete(post)}
                          >
                            <i className="bi bi-trash" />
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
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="sp-modal-overlay" dir="rtl">
          <div className="sp-modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <button className="sp-modal-close" onClick={() => setShowModal(false)}>
              <i className="bi bi-x" />
            </button>
            <div className="sp-modal-header">
              <div className="sp-modal-icon">
                <i className={`bi ${editing ? 'bi-pencil-square' : 'bi-plus-circle'}`} />
              </div>
              <h5>{editing ? 'ویرایش پست' : 'پست جدید'}</h5>
            </div>

            {error && (
              <div className="sp-alert error mb-3">
                <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label">عنوان</label>
                <input
                  className="form-control"
                  required
                  placeholder="عنوان پست را بنویسید..."
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">محتوا</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                  placeholder="محتوای پست خود را بنویسید..."
                />
              </div>
              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <label className="form-label">تصویر جلد (اختیاری)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.files[0] || null }))}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">وضعیت انتشار</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="draft">پیش‌نویس</option>
                    <option value="published">منتشر شده</option>
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setShowModal(false)}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', fontWeight: 700 }}
                  disabled={saving}
                >
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />ذخیره...</>
                    : <><i className="bi bi-check-lg me-1" />ذخیره پست</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
