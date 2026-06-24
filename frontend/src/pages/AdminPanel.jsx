import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const STATUS_LABELS = { pending: 'در انتظار', approved: 'تأیید شده', rejected: 'رد شده' }

export default function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('applications')
  const [applications, setApplications] = useState([])
  const [articles, setArticles] = useState([])
  const [posts, setPosts] = useState([])
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [statusFilter, setStatusFilter] = useState('pending')

  useEffect(() => {
    if (!user || user.role !== 'owner') navigate('/fa/articles')
  }, [user, navigate])

  useEffect(() => {
    setLoading(true)
    if (tab === 'applications') {
      client.get(`/coaches/applications/?status=${statusFilter}`)
        .then(({ data }) => setApplications(data))
        .finally(() => setLoading(false))
    } else if (tab === 'articles') {
      client.get('/articles/?lang=fa')
        .then(({ data }) => setArticles([...data].sort((a, b) => b.view_count - a.view_count)))
        .finally(() => setLoading(false))
    } else if (tab === 'posts') {
      client.get('/posts/')
        .then(({ data }) => setPosts([...data].sort((a, b) => b.view_count - a.view_count)))
        .finally(() => setLoading(false))
    } else if (tab === 'coaches') {
      client.get('/coaches/approved/')
        .then(({ data }) => setCoaches(data))
        .finally(() => setLoading(false))
    }
  }, [tab, statusFilter])

  async function handleReview(id, action) {
    setActionLoading(id)
    try {
      await client.post(`/coaches/applications/${id}/review/`, { action })
      setApplications((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'خطا رخ داد')
    } finally {
      setActionLoading(null)
    }
  }

  if (!user || user.role !== 'owner') return null

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }}>
      {/* Header */}
      <div className="sp-admin-header">
        <div className="container" dir="rtl">
          <h2>پنل مدیریت</h2>
          <p>مدیریت مربیان، پست‌ها و آمار محتوا</p>
        </div>
      </div>

      <div className="container pb-5" dir="rtl">
        {/* Tabs */}
        <div className="sp-tabs">
          {[
            { key: 'applications', icon: 'bi-person-check', label: 'درخواست‌ها' },
            { key: 'coaches',      icon: 'bi-people',        label: 'مربیان' },
            { key: 'posts',        icon: 'bi-journal-text',  label: 'پست‌ها' },
            { key: 'articles',     icon: 'bi-newspaper',     label: 'مقالات' },
          ].map(({ key, icon, label }) => (
            <button key={key} className={`sp-tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              <i className={`bi ${icon} me-1`} />{label}
            </button>
          ))}
        </div>

        {/* Applications */}
        {tab === 'applications' && (
          <>
            <div className="d-flex gap-2 mb-3">
              {['pending', 'approved', 'rejected'].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-secondary'}`}
                  style={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}
                  onClick={() => setStatusFilter(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="sp-loading"><div className="sp-spinner" /></div>
            ) : applications.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon"><i className="bi bi-inbox" /></div>
                <p>درخواستی در این وضعیت وجود ندارد.</p>
              </div>
            ) : (
              <div className="sp-table">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>نام</th>
                      <th>کاربری</th>
                      <th>تخصص</th>
                      <th>تاریخ</th>
                      <th>وضعیت</th>
                      {statusFilter === 'pending' && <th>عملیات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td style={{ fontWeight: 600 }}>{app.first_name} {app.last_name}</td>
                        <td style={{ color: 'var(--clr-text-2)' }}>{app.username}</td>
                        <td style={{ color: 'var(--clr-text-2)' }}>{app.expertise || '—'}</td>
                        <td style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem' }}>
                          {new Date(app.created_at).toLocaleDateString('fa-IR')}
                        </td>
                        <td><span className={`sp-status ${app.status}`}>{STATUS_LABELS[app.status]}</span></td>
                        {statusFilter === 'pending' && (
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-success"
                                style={{ borderRadius: 'var(--radius-sm)', fontWeight: 700 }}
                                disabled={actionLoading === app.id}
                                onClick={() => handleReview(app.id, 'approve')}
                              >
                                <i className="bi bi-check-lg me-1" />تأیید
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ borderRadius: 'var(--radius-sm)', fontWeight: 700 }}
                                disabled={actionLoading === app.id}
                                onClick={() => handleReview(app.id, 'reject')}
                              >
                                <i className="bi bi-x-lg me-1" />رد
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Coaches */}
        {tab === 'coaches' && (
          loading ? (
            <div className="sp-loading"><div className="sp-spinner" /></div>
          ) : coaches.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon"><i className="bi bi-people" /></div>
              <p>هنوز مربی تأیید شده‌ای وجود ندارد.</p>
            </div>
          ) : (
            <div className="row g-3">
              {coaches.map((coach) => (
                <div key={coach.user_id} className="col-12 col-md-6 col-lg-4">
                  <div className="sp-card p-3">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="sp-coach-avatar" style={{ width: 48, height: 48, fontSize: '.9rem' }}>
                        {coach.first_name?.[0]}{coach.last_name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{coach.first_name} {coach.last_name}</div>
                        <div style={{ color: 'var(--clr-text-muted)', fontSize: '.8rem' }}>{coach.expertise || '—'}</div>
                      </div>
                    </div>
                    {coach.experience_years > 0 && (
                      <div style={{ marginBottom: '.75rem' }}>
                        <span style={{
                          background: 'var(--clr-teal-light)', color: 'var(--clr-teal)',
                          padding: '.15rem .65rem', borderRadius: 'var(--radius-full)',
                          fontSize: '.75rem', fontWeight: 700,
                        }}>
                          {coach.experience_years} سال تجربه
                        </span>
                      </div>
                    )}
                    <Link
                      to={`/coaches/${coach.user_id}`}
                      className="btn btn-sm btn-outline-primary w-100"
                      style={{ borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
                    >
                      <i className="bi bi-box-arrow-up-left me-1" />مشاهده صفحه مربی
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Posts */}
        {tab === 'posts' && (
          loading ? (
            <div className="sp-loading"><div className="sp-spinner" /></div>
          ) : posts.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon"><i className="bi bi-journal-x" /></div>
              <p>هنوز پست منتشر شده‌ای وجود ندارد.</p>
            </div>
          ) : (
            <div className="sp-table">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>مربی</th>
                    <th>بازدید</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.title}</td>
                      <td style={{ color: 'var(--clr-text-2)' }}>{p.coach_name}</td>
                      <td>
                        <span className="sp-view-count">
                          <i className="bi bi-eye" />{p.view_count.toLocaleString('fa-IR')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem' }}>
                        {new Date(p.created_at).toLocaleDateString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Articles */}
        {tab === 'articles' && (
          loading ? (
            <div className="sp-loading"><div className="sp-spinner" /></div>
          ) : (
            <div className="sp-table">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>دسته‌بندی</th>
                    <th>بازدید</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a.slug}>
                      <td style={{ fontWeight: 600 }}>{a.title}</td>
                      <td style={{ color: 'var(--clr-text-2)' }}>{a.category}</td>
                      <td>
                        <span className="sp-view-count">
                          <i className="bi bi-eye" />{a.view_count.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
