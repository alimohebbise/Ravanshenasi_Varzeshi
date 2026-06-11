import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ onClose, onSwitchToSignup }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const me = await login(form.username, form.password)
      onClose()
      if (me.role === 'coach') navigate('/coach-dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'نام کاربری یا رمز عبور اشتباه است.')
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
          <div className="sp-modal-icon">
            <i className="bi bi-person-circle" />
          </div>
          <h5>خوش آمدید</h5>
          <p>برای ادامه وارد حساب خود شوید</p>
        </div>

        {error && (
          <div className="sp-alert error">
            <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">نام کاربری</label>
            <div className="input-icon-wrap">
              <i className="bi bi-person" />
              <input
                className="form-control"
                placeholder="نام کاربری خود را وارد کنید"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">رمز عبور</label>
            <div className="input-icon-wrap">
              <i className="bi bi-lock" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-control"
                placeholder="رمز عبور خود را وارد کنید"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          <button
            className="btn btn-dark w-100 py-2"
            disabled={loading}
            style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />در حال ورود...</>
              : <><i className="bi bi-box-arrow-in-right me-2" />ورود به حساب</>
            }
          </button>
        </form>

        <div className="sp-modal-footer">
          حساب ندارید؟{' '}
          <button className="link" onClick={onSwitchToSignup}>ثبت نام کنید</button>
        </div>
      </div>
    </div>
  )
}
