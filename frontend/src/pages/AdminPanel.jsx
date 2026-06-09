import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const STATUS_LABELS = { pending: 'در انتظار', approved: 'تأیید شده', rejected: 'رد شده' }
const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'danger' }

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
    if (!user || user.role !== 'owner') {
      navigate('/fa/articles')
    }
  }, [user, navigate])

  useEffect(() => {
    setLoading(true)
    if (tab === 'applications') {
      client.get(`/coaches/applications/?status=${statusFilter}`)
        .then(({ data }) => setApplications(data))
        .finally(() => setLoading(false))
    } else if (tab === 'articles') {
      Promise.all([
        client.get('/articles/?lang=fa'),
        client.get('/articles/?lang=en'),
      ]).then(([fa, en]) => {
        setArticles([...fa.data, ...en.data].sort((a, b) => b.view_count - a.view_count))
      }).finally(() => setLoading(false))
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
    <div className="container py-4" style={{ marginTop: '70px' }} dir="rtl">
      <h3 className="fw-bold mb-4">پنل مدیریت</h3>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'applications' ? 'active' : ''}`}
            onClick={() => setTab('applications')}
          >
            درخواست‌های مربیگری
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'articles' ? 'active' : ''}`}
            onClick={() => setTab('articles')}
          >
            آمار مقالات
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'posts' ? 'active' : ''}`}
            onClick={() => setTab('posts')}
          >
            پست‌های مربیان
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'coaches' ? 'active' : ''}`}
            onClick={() => setTab('coaches')}
          >
            مربیان تأیید شده
          </button>
        </li>
      </ul>

      {tab === 'applications' && (
        <>
          <div className="d-flex gap-2 mb-3">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? `btn-${STATUS_COLORS[s]}` : `btn-outline-${STATUS_COLORS[s]}`}`}
                onClick={() => setStatusFilter(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" /></div>
          ) : applications.length === 0 ? (
            <p className="text-muted">درخواستی یافت نشد.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>نام</th>
                    <th>کاربری</th>
                    <th>تخصص</th>
                    <th>تاریخ ثبت</th>
                    <th>وضعیت</th>
                    {statusFilter === 'pending' && <th>عملیات</th>}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.first_name} {app.last_name}</td>
                      <td>{app.username}</td>
                      <td>{app.expertise || '—'}</td>
                      <td>{new Date(app.created_at).toLocaleDateString('fa-IR')}</td>
                      <td>
                        <span className={`badge bg-${STATUS_COLORS[app.status]}`}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </td>
                      {statusFilter === 'pending' && (
                        <td>
                          <button
                            className="btn btn-success btn-sm me-2"
                            disabled={actionLoading === app.id}
                            onClick={() => handleReview(app.id, 'approve')}
                          >
                            تأیید
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading === app.id}
                            onClick={() => handleReview(app.id, 'reject')}
                          >
                            رد
                          </button>
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

      {tab === 'posts' && (
        loading ? (
          <div className="text-center py-5"><div className="spinner-border" /></div>
        ) : posts.length === 0 ? (
          <p className="text-muted">هنوز پست منتشر شده‌ای وجود ندارد.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>عنوان</th>
                  <th>مربی</th>
                  <th>بازدید</th>
                  <th>تاریخ انتشار</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-semibold">{p.title}</td>
                    <td>{p.coach_name}</td>
                    <td><strong>{p.view_count.toLocaleString('fa-IR')}</strong></td>
                    <td className="text-muted small">
                      {new Date(p.created_at).toLocaleDateString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'coaches' && (
        loading ? (
          <div className="text-center py-5"><div className="spinner-border" /></div>
        ) : coaches.length === 0 ? (
          <p className="text-muted">هنوز مربی تأیید شده‌ای وجود ندارد.</p>
        ) : (
          <div className="row g-3">
            {coaches.map((coach) => (
              <div key={coach.user_id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div
                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: 48, height: 48, flexShrink: 0, fontSize: '1.1rem' }}
                      >
                        {coach.first_name?.[0]}{coach.last_name?.[0]}
                      </div>
                      <div>
                        <div className="fw-bold">{coach.first_name} {coach.last_name}</div>
                        <div className="text-muted small">{coach.expertise || '—'}</div>
                      </div>
                    </div>
                    {coach.experience_years > 0 && (
                      <span className="badge bg-light text-dark me-2">
                        {coach.experience_years} سال تجربه
                      </span>
                    )}
                  </div>
                  <div className="card-footer bg-white border-0">
                    <Link
                      to={`/coaches/${coach.user_id}`}
                      className="btn btn-sm btn-outline-primary w-100"
                    >
                      مشاهده صفحه مربی
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'articles' && (
        loading ? (
          <div className="text-center py-5"><div className="spinner-border" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>عنوان</th>
                  <th>زبان</th>
                  <th>دسته‌بندی</th>
                  <th>بازدید</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={`${a.slug}-${a.language}`}>
                    <td>{a.title}</td>
                    <td>{a.language === 'fa' ? 'فارسی' : 'English'}</td>
                    <td>{a.category}</td>
                    <td><strong>{a.view_count}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
