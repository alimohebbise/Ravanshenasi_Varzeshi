import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ onClose, onSwitchToSignup }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'نام کاربری یا رمز عبور اشتباه است.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close position-absolute top-0 end-0 m-3" onClick={onClose} />
        <h5 className="mb-4 text-center fw-bold">ورود به سایت</h5>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">نام کاربری</label>
            <input
              className="form-control"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="form-label">رمز عبور</label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-dark w-100" disabled={loading}>
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
        <hr />
        <p className="text-center mb-0">
          حساب ندارید؟{' '}
          <button className="btn btn-link p-0" onClick={onSwitchToSignup}>
            ثبت نام
          </button>
        </p>
      </div>
    </div>
  )
}
