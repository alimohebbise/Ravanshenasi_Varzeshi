import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function CoachApplication() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [existing, setExisting] = useState(undefined) // undefined = loading
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    national_id: '',
    date_of_birth: '',
    bio: '',
    expertise: '',
    experience_years: '',
  })
  const [files, setFiles] = useState({ educational_documents: null, digital_signature: null })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/fa/articles')
      return
    }
    client.get('/coaches/my-application/')
      .then(({ data }) => setExisting(data))
      .catch(() => setExisting(null))
  }, [user, navigate])

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (files.educational_documents) fd.append('educational_documents', files.educational_documents)
      if (files.digital_signature) fd.append('digital_signature', files.digital_signature)

      await client.post('/coaches/apply/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (data) {
        setError(Object.values(data).flat().join(' '))
      } else {
        setError('خطایی رخ داد. دوباره تلاش کنید.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null
  if (existing === undefined) return <div className="text-center mt-5"><div className="spinner-border" /></div>

  if (success || existing) {
    const status = existing?.status
    const statusMap = { pending: 'در انتظار بررسی', approved: 'تأیید شده', rejected: 'رد شده' }
    const badgeMap = { pending: 'warning', approved: 'success', rejected: 'danger' }

    return (
      <div className="container py-5" style={{ marginTop: '70px' }} dir="rtl">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: 500 }}>
          <div className="card-body text-center py-5">
            <i className="bi bi-patch-check fs-1 text-success mb-3 d-block" />
            <h5 className="fw-bold">درخواست ثبت شده است</h5>
            {existing?.status && (
              <p>
                وضعیت:{' '}
                <span className={`badge bg-${badgeMap[status]}`}>{statusMap[status]}</span>
              </p>
            )}
            <p className="text-muted">پس از بررسی توسط مدیر، نتیجه اعلام می‌شود.</p>
            <button className="btn btn-dark" onClick={() => navigate('/fa/articles')}>
              بازگشت به مقالات
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5" style={{ marginTop: '70px' }} dir="rtl">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: 640 }}>
        <div className="card-body p-4">
          <h4 className="fw-bold mb-4">ثبت نام مربی</h4>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">نام</label>
                <input className="form-control" value={form.first_name} onChange={set('first_name')} required />
              </div>
              <div className="col-6">
                <label className="form-label">نام خانوادگی</label>
                <input className="form-control" value={form.last_name} onChange={set('last_name')} required />
              </div>
              <div className="col-6">
                <label className="form-label">کد ملی</label>
                <input className="form-control" value={form.national_id} onChange={set('national_id')} required maxLength={10} />
              </div>
              <div className="col-6">
                <label className="form-label">تاریخ تولد</label>
                <input type="date" className="form-control" value={form.date_of_birth} onChange={set('date_of_birth')} required />
              </div>
              <div className="col-12">
                <label className="form-label">تخصص</label>
                <input className="form-control" value={form.expertise} onChange={set('expertise')} placeholder="مثال: روانشناسی ورزشی، مربیگری فوتبال" />
              </div>
              <div className="col-6">
                <label className="form-label">سابقه (سال)</label>
                <input type="number" className="form-control" value={form.experience_years} onChange={set('experience_years')} min={0} />
              </div>
              <div className="col-12">
                <label className="form-label">بیوگرافی</label>
                <textarea className="form-control" rows={3} value={form.bio} onChange={set('bio')} />
              </div>
              <div className="col-12">
                <label className="form-label">مدارک تحصیلی (فایل PDF یا تصویر)</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  onChange={(e) => setFiles({ ...files, educational_documents: e.target.files[0] })}
                />
              </div>
              <div className="col-12">
                <label className="form-label">امضای دیجیتال (تصویر)</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".jpg,.jpeg,.png"
                  required
                  onChange={(e) => setFiles({ ...files, digital_signature: e.target.files[0] })}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-dark w-100" disabled={loading}>
                  {loading ? 'در حال ارسال...' : 'ارسال درخواست'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
