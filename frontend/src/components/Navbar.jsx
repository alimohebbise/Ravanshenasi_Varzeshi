import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { lang = 'fa' } = useParams()
  const [modal, setModal] = useState(null) // 'login' | 'signup' | null

  function handleLogout() {
    logout()
    navigate(`/${lang}/articles`)
  }

  const roleLabel = { owner: 'مدیر', coach: 'مربی', athlete: 'کاربر' }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top" dir="rtl">
        <div className="container">
          <Link className="navbar-brand fw-bold" to={`/${lang}/articles`}>
            روانشناسی ورزشی
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMain"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navMain">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/fa/articles">فارسی</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/en/articles">English</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/coaches">مربیان</Link>
              </li>
              {user && user.role === 'athlete' && (
                <li className="nav-item">
                  <Link className="nav-link" to="/coach-application">ثبت نام مربی</Link>
                </li>
              )}
              {(user?.role === 'coach' || user?.role === 'owner') && (
                <li className="nav-item">
                  <Link className="nav-link" to="/coach-dashboard">داشبورد مربی</Link>
                </li>
              )}
              {user?.role === 'owner' && (
                <li className="nav-item">
                  <Link className="nav-link" to="/admin-panel">پنل مدیریت</Link>
                </li>
              )}
            </ul>

            <div className="d-flex align-items-center gap-2">
              {user ? (
                <>
                  <span className="text-light small">
                    <i className="bi bi-person-circle me-1" />
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                    <span className="badge bg-secondary ms-2">{roleLabel[user.role]}</span>
                  </span>
                  <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline-light btn-sm" onClick={() => setModal('login')}>
                    ورود
                  </button>
                  <button className="btn btn-light btn-sm" onClick={() => setModal('signup')}>
                    ثبت نام
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {modal === 'login' && (
        <LoginModal
          onClose={() => setModal(null)}
          onSwitchToSignup={() => setModal('signup')}
        />
      )}
      {modal === 'signup' && (
        <SignupModal
          onClose={() => setModal(null)}
          onSwitchToLogin={() => setModal('login')}
        />
      )}
    </>
  )
}
