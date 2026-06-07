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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      setError('رمز عبور و تکرار آن یکسان نیستند.')
      return
    }
    setLoading(true)
    try {
      await register(form)
      onClose()
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.values(data).flat().join(' ')
        setError(msgs)
      } else {
        setError('خطایی رخ داد. دوباره تلاش کنید.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close position-absolute top-0 end-0 m-3" onClick={onClose} />
        <h5 className="mb-4 text-center fw-bold">ثبت نام</h5>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">نام کاربری</label>
            <input className="form-control" value={form.username} onChange={set('username')} required autoFocus />
          </div>
          <div className="mb-3">
            <label className="form-label">شماره تلفن</label>
            <input className="form-control" type="tel" value={form.phone_number} onChange={set('phone_number')} required />
          </div>
          <div className="mb-3">
            <label className="form-label">ایمیل</label>
            <input className="form-control" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="mb-3">
            <label className="form-label">رمز عبور</label>
            <input className="form-control" type="password" value={form.password} onChange={set('password')} required minLength={8} />
          </div>
          <div className="mb-3">
            <label className="form-label">تکرار رمز عبور</label>
            <input className="form-control" type="password" value={form.confirm_password} onChange={set('confirm_password')} required />
          </div>
          <button className="btn btn-dark w-100" disabled={loading}>
            {loading ? 'در حال ثبت نام...' : 'ثبت نام'}
          </button>
        </form>
        <hr />
        <p className="text-center mb-0">
          حساب دارید؟{' '}
          <button className="btn btn-link p-0" onClick={onSwitchToLogin}>
            ورود
          </button>
        </p>
      </div>
    </div>
  )
}
