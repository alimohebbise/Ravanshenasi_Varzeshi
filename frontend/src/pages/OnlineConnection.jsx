import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function OnlineConnection() {
  const { user } = useAuth()
  const [coaches, setCoaches] = useState([])
  const [coachesLoading, setCoachesLoading] = useState(true)
  const [coachesError, setCoachesError] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    recipientType: 'admin',
    recipient_coach: '',
    subject: '',
    message: '',
  })
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    client.get('/coaches/approved/')
      .then(({ data }) => setCoaches(data))
      .catch(() => setCoachesError(true))
      .finally(() => setCoachesLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
    setForm((current) => ({
      ...current,
      name: current.name || fullName || user.username || '',
      email: current.email || user.email || '',
    }))
  }, [user])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)
    setSubmitting(true)

    const payload = {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      recipient_coach: form.recipientType === 'coach' ? Number(form.recipient_coach) : null,
    }

    try {
      await client.post('/auth/online-connection/', payload)
      setForm((current) => ({ ...current, subject: '', message: '' }))
      setFeedback({
        type: 'success',
        message: form.recipientType === 'coach'
          ? 'پیام شما برای مربی انتخاب‌شده ارسال شد؛ او می‌تواند از داشبورد خود پاسخ دهد.'
          : 'پیام شما برای مدیر سایت ثبت شد.',
      })
    } catch (error) {
      const details = error.response?.data
      const validationMessage = details && Object.values(details).flat().join(' ')
      setFeedback({
        type: 'error',
        message: validationMessage || 'ارسال پیام انجام نشد. لطفاً دوباره تلاش کنید.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main dir="rtl" style={{ marginTop: 'var(--navbar-h)' }}>
      <header style={{ background: 'var(--clr-navy)', color: '#fff', padding: '2rem 0' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontSize: '1.7rem', fontWeight: 800, marginBottom: '.35rem' }}>
            <i className="bi bi-chat-dots me-2" />ارتباط آنلاین
          </h1>
          <p style={{ color: 'rgba(255,255,255,.65)', margin: 0 }}>
            با مدیر سایت یا مربی موردنظرتان در ارتباط باشید.
          </p>
        </div>
      </header>

      <div className="container py-5">
        <div className="row g-4 justify-content-center">
          <aside className="col-lg-4">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>انتخاب گیرنده</h2>
            <p style={{ color: 'var(--clr-text-2)', lineHeight: 1.9 }}>
              پیام برای مدیر سایت در پنل مدیریت ثبت می‌شود. درخواست ارتباط با مربی مستقیماً در داشبورد همان مربی نمایش داده می‌شود.
            </p>
            <div className="d-flex align-items-start gap-2" style={{ color: 'var(--clr-text-muted)', fontSize: '.85rem' }}>
              <i className="bi bi-shield-check" />
              <span>ایمیل شما برای پاسخ‌گویی در اختیار گیرنده پیام قرار می‌گیرد.</span>
            </div>
          </aside>

          <div className="col-lg-7">
            <form className="sp-card p-4 p-md-5" onSubmit={handleSubmit}>
              {feedback && (
                <div
                  className={`sp-alert ${feedback.type === 'error' ? 'error' : 'success'} mb-4`}
                  role={feedback.type === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                >
                  {feedback.message}
                </div>
              )}

              <fieldset className="mb-3">
                <legend className="form-label">ارتباط با</legend>
                <div className="d-flex gap-4 flex-wrap" role="radiogroup" aria-label="گیرنده پیام">
                  <label className="form-check d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="recipientType"
                      value="admin"
                      checked={form.recipientType === 'admin'}
                      onChange={updateField}
                    />
                    <span>مدیر سایت</span>
                  </label>
                  <label className="form-check d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="recipientType"
                      value="coach"
                      checked={form.recipientType === 'coach'}
                      onChange={updateField}
                      disabled={coachesLoading || coaches.length === 0}
                    />
                    <span>ارتباط با مربی دلخواه</span>
                  </label>
                </div>
                {coachesError && (
                  <p className="mb-0 mt-2" role="alert" style={{ color: 'var(--clr-danger)' }}>
                    فهرست مربیان بارگذاری نشد. دوباره صفحه را بارگذاری کنید.
                  </p>
                )}
                {!coachesLoading && !coachesError && coaches.length === 0 && (
                  <p className="mb-0 mt-2" style={{ color: 'var(--clr-text-muted)' }}>
                    در حال حاضر مربی تأییدشده‌ای برای انتخاب وجود ندارد.
                  </p>
                )}
              </fieldset>

              {form.recipientType === 'coach' && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="connection-coach">انتخاب مربی</label>
                  <select
                    id="connection-coach"
                    className="form-select"
                    name="recipient_coach"
                    value={form.recipient_coach}
                    onChange={updateField}
                    required
                    disabled={coachesLoading || coachesError || coaches.length === 0}
                  >
                    <option value="">{coachesLoading ? 'در حال دریافت فهرست...' : 'یک مربی را انتخاب کنید'}</option>
                    {coaches.map((coach) => (
                      <option key={coach.user_id} value={coach.user_id}>
                        {coach.first_name} {coach.last_name}{coach.expertise ? ` · ${coach.expertise}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label" htmlFor="contact-name">نام</label>
                  <input
                    id="contact-name"
                    className="form-control"
                    name="name"
                    autoComplete="name"
                    maxLength={150}
                    value={form.name}
                    onChange={updateField}
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label" htmlFor="contact-email">ایمیل</label>
                  <input
                    id="contact-email"
                    className="form-control"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={updateField}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="contact-subject">موضوع</label>
                  <input
                    id="contact-subject"
                    className="form-control"
                    name="subject"
                    maxLength={150}
                    value={form.subject}
                    onChange={updateField}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="contact-message">پیام</label>
                  <textarea
                    id="contact-message"
                    className="form-control"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={updateField}
                    required
                  />
                </div>
                <div className="col-12">
                  <button
                    className="btn btn-dark w-100 py-2"
                    disabled={submitting || (form.recipientType === 'coach' && !form.recipient_coach)}
                  >
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />در حال ثبت...</>
                      : <><i className="bi bi-send me-2" />ارسال پیام {form.recipientType === 'coach' ? 'به مربی' : 'به مدیر سایت'}</>
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}