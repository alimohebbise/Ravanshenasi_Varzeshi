import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [statusFilter, setStatusFilter] = useState('pending')

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      navigate('/fa/articles')
    }
  }, [user, navigate])

  useEffect(() => {
    if (tab === 'applications') {
      setLoading(true)
      client.get(`/coaches/applications/?status=${statusFilter}`)
        .then(({ data }) => setApplications(data))
        .finally(() => setLoading(false))
    } else {
      setLoading(true)
      Promise.all([
        client.get('/articles/?lang=fa'),
        client.get('/articles/?lang=en'),
      ]).then(([fa, en]) => {
        setArticles([...fa.data, ...en.data].sort((a, b) => b.view_count - a.view_count))
      }).finally(() => setLoading(false))
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
