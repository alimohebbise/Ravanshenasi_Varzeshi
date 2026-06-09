import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function SignupModal({ onClose, onSwitchToLogin }) {
  const { register } = useAuth()
  const [form, setForm] = useState({
    username: '',
    phone_number: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const pwMatch = form.password && form.confirm_password
    ? form.password === form.confirm_password
    : null   // null = not yet checked

  async function handleSubmit(e) {
    e.preventDefault()
    if (pwMatch === false) { setError('رمز عبور و تکرار آن یکسان نیستند.'); return }
    setError('')
    setLoading(true)
    try {
      await register(form)
      onClose()
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

  return (
    <div className="sp-modal-overlay" onClick={onClose} dir="rtl">
      <div className="sp-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="sp-modal-close" onClick={onClose} aria-label="بستن">
          <i className="bi bi-x" />
        </button>

        <div className="sp-modal-header">
          <div className="sp-modal-icon" style={{ background: 'var(--clr-success-light)', color: 'var(--clr-success)' }}>
            <i className="bi bi-person-plus" />
          </div>
          <h5>ایجاد حساب کاربری</h5>
          <p>به جمع روانشناسی ورزشی بپیوندید</p>
        </div>

        {error && (
          <div className="sp-alert error">
            <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">نام کاربری</label>
            <div className="input-icon-wrap">
              <i className="bi bi-at" />
              <input
                className="form-control"
                placeholder="مثال: ali_sports"
                value={form.username}
                onChange={set('username')}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">شماره تلفن</label>
            <div className="input-icon-wrap">
              <i className="bi bi-phone" />
              <input
                className="form-control"
                type="tel"
                placeholder="09123456789"
                value={form.phone_number}
                onChange={set('phone_number')}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">ایمیل</label>
            <div className="input-icon-wrap">
              <i className="bi bi-envelope" />
              <input
                className="form-control"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">رمز عبور</label>
            <div className="input-icon-wrap">
              <i className="bi bi-lock" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-control"
                placeholder="حداقل ۸ کاراکتر"
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
              />
              <button type="button" className="toggle-pw" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {form.password.length > 0 && form.password.length < 8 && (
              <div className="form-error"><i className="bi bi-x-circle" />رمز عبور باید حداقل ۸ کاراکتر باشد</div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label">تکرار رمز عبور</label>
            <div className="input-icon-wrap">
              <i className="bi bi-lock-fill" />
              <input
                type={showCPw ? 'text' : 'password'}
                className="form-control"
                placeholder="رمز عبور را تکرار کنید"
                value={form.confirm_password}
                onChange={set('confirm_password')}
                required
                style={pwMatch === false ? { borderColor: 'var(--clr-danger)' }
                     : pwMatch === true  ? { borderColor: 'var(--clr-success)' }
                     : {}}
              />
              <button type="button" className="toggle-pw" onClick={() => setShowCPw(v => !v)} tabIndex={-1}>
                <i className={`bi ${showCPw ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {pwMatch === false && (
              <div className="form-error"><i className="bi bi-x-circle" />رمز عبور مطابقت ندارد</div>
            )}
            {pwMatch === true && (
              <div className="form-hint" style={{ color: 'var(--clr-success)' }}>
                <i className="bi bi-check-circle me-1" />رمز عبور مطابقت دارد
              </div>
            )}
          </div>

          <button
            className="btn w-100 py-2"
            style={{
              background: 'var(--clr-success)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              border: 'none',
            }}
            disabled={loading || pwMatch === false}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />در حال ثبت نام...</>
              : <><i className="bi bi-person-check me-2" />ایجاد حساب</>
            }
          </button>
        </form>

        <div className="sp-modal-footer">
          حساب دارید؟{' '}
          <button className="link" onClick={onSwitchToLogin}>وارد شوید</button>
        </div>
      </div>
    </div>
  )
}
