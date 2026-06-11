import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

function FileUpload({ label, hint, accept, required, onChange, value }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="file-upload-area">
        <input type="file" accept={accept} required={required} onChange={onChange} />
        <div className="icon"><i className="bi bi-cloud-upload" /></div>
        <div className="label">{value ? value.name : 'فایل را اینجا بکشید یا کلیک کنید'}</div>
        {value
          ? <div className="selected"><i className="bi bi-check-circle me-1" />{value.name}</div>
          : <div className="hint">{hint}</div>
        }
      </div>
    </div>
  )
}

export default function CoachApplication() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [existing, setExisting] = useState(undefined)
  const [form, setForm] = useState({
    first_name: '', last_name: '', national_id: '',
    date_of_birth: '', bio: '', expertise: '', experience_years: '',
  })
  const [files, setFiles] = useState({ educational_documents: null, digital_signature: null })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/fa/articles'); return }
    client.get('/coaches/my-application/')
      .then(({ data }) => {
        if (data) navigate('/my-profile', { replace: true })
        else setExisting(null)
      })
      .catch(() => setExisting(null))
  }, [user, navigate])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (files.educational_documents) fd.append('educational_documents', files.educational_documents)
      if (files.digital_signature) fd.append('digital_signature', files.digital_signature)
      await client.post('/coaches/apply/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate('/my-profile', { replace: true })
    } catch (err) {
      const data = err.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'خطایی رخ داد. دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null
  if (existing === undefined) return (
    <div className="sp-loading" style={{ marginTop: 'var(--navbar-h)' }}>
      <div className="sp-spinner" />
    </div>
  )

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }}>
      <div style={{ background: 'var(--clr-navy)', color: '#fff', padding: '2rem 0' }}>
        <div className="container" dir="rtl">
          <h2 style={{ color: '#fff', marginBottom: '.25rem' }}>
            <i className="bi bi-person-badge me-2" />ثبت نام مربی
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', margin: 0, fontSize: '.9rem' }}>
            فرم زیر را با اطلاعات صحیح تکمیل کنید. مدیر پس از بررسی با شما تماس خواهد گرفت.
          </p>
        </div>
      </div>

      <div className="container py-4" dir="rtl">
        <div className="mx-auto" style={{ maxWidth: 680 }}>
          {error && (
            <div className="sp-alert error mb-3">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="sp-card p-4 mb-3">
              <div className="form-section-title">اطلاعات شخصی</div>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">نام</label>
                  <input className="form-control" value={form.first_name} onChange={set('first_name')} required placeholder="نام" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">نام خانوادگی</label>
                  <input className="form-control" value={form.last_name} onChange={set('last_name')} required placeholder="نام خانوادگی" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">کد ملی</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-credit-card" />
                    <input className="form-control" value={form.national_id} onChange={set('national_id')} required maxLength={10} placeholder="۱۰ رقم" />
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">تاریخ تولد</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-calendar3" />
                    <input type="date" className="form-control" value={form.date_of_birth} onChange={set('date_of_birth')} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="sp-card p-4 mb-3">
              <div className="form-section-title">اطلاعات حرفه‌ای</div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">تخصص</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-briefcase" />
                    <input className="form-control" value={form.expertise} onChange={set('expertise')} placeholder="مثال: روانشناسی ورزشی، مربیگری فوتبال" />
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">سابقه (سال)</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-clock-history" />
                    <input type="number" className="form-control" value={form.experience_years} onChange={set('experience_years')} min={0} placeholder="۰" />
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">بیوگرافی</label>
                  <textarea className="form-control" rows={4} value={form.bio} onChange={set('bio')} placeholder="خلاصه‌ای از سوابق و تخصص خود بنویسید..." />
                </div>
              </div>
            </div>

            <div className="sp-card p-4 mb-4">
              <div className="form-section-title">مدارک و مستندات</div>
              <div className="row g-3">
                <div className="col-12">
                  <FileUpload
                    label="مدارک تحصیلی"
                    hint="PDF، JPG یا PNG — حداکثر ۱۰ مگابایت"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    value={files.educational_documents}
                    onChange={(e) => setFiles({ ...files, educational_documents: e.target.files[0] })}
                  />
                </div>
                <div className="col-12">
                  <FileUpload
                    label="امضای دیجیتال"
                    hint="JPG یا PNG — تصویر واضح امضا"
                    accept=".jpg,.jpeg,.png"
                    required
                    value={files.digital_signature}
                    onChange={(e) => setFiles({ ...files, digital_signature: e.target.files[0] })}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn btn-dark w-100 py-2"
              style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />در حال ارسال...</>
                : <><i className="bi bi-send me-2" />ارسال درخواست</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
