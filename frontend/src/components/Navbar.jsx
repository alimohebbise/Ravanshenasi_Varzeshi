import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { lang = 'fa' } = useParams()
  const [modal, setModal] = useState(null)   // 'login' | 'signup' | null
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    setMobileOpen(false)
    navigate(`/${lang}/articles`)
  }

  function initials() {
    if (!user) return ''
    if (user.first_name && user.last_name)
      return `${user.first_name[0]}${user.last_name[0]}`
    return user.username?.[0]?.toUpperCase() ?? '?'
  }

  function displayName() {
    if (!user) return ''
    return user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username
  }

  const roleLabel = { owner: 'مدیر', coach: 'مربی', athlete: 'کاربر' }

  const NavLinks = ({ mobile = false, onClose = () => {} }) => (
    <>
      <li>
        <Link className="sp-nav-link" to="/fa/articles" onClick={onClose}>
          <i className="bi bi-newspaper" />
          فارسی
        </Link>
      </li>
      <li>
        <Link className="sp-nav-link" to="/en/articles" onClick={onClose}>
          <i className="bi bi-translate" />
          English
        </Link>
      </li>
      <li>
        <Link className="sp-nav-link" to="/coaches" onClick={onClose}>
          <i className="bi bi-people" />
          مربیان
        </Link>
      </li>
      {user && user.role === 'coach' && (
        <>
          <li>
            <Link className="sp-nav-link accent" to={`/coaches/${user.id}`} onClick={onClose}>
              <i className="bi bi-person-badge" />
              صفحه عمومی
            </Link>
          </li>
          <li>
            <Link className="sp-nav-link accent" to="/coach-dashboard" onClick={onClose}>
              <i className="bi bi-pencil-square" />
              پست‌ها
            </Link>
          </li>
          <li>
            <Link className="sp-nav-link accent" to="/my-profile" onClick={onClose}>
              <i className="bi bi-person-vcard" />
              پروفایل من
            </Link>
          </li>
        </>
      )}
      {user && user.role === 'athlete' && (
        <li>
          <Link className="sp-nav-link accent" to="/my-profile" onClick={onClose}>
            <i className="bi bi-person-vcard" />
            پروفایل من
          </Link>
        </li>
      )}
      {user && user.role === 'owner' && (
        <li>
          <Link className="sp-nav-link accent" to="/coach-dashboard" onClick={onClose}>
            <i className="bi bi-pencil-square" />
            داشبورد مربی
          </Link>
        </li>
      )}
      {user?.role === 'owner' && (
        <li>
          <Link className="sp-nav-link accent" to="/admin-panel" onClick={onClose}>
            <i className="bi bi-shield-check" />
            پنل مدیریت
          </Link>
        </li>
      )}
    </>
  )

  return (
    <>
      <nav className="sp-navbar" dir="rtl">
        <div className="container">
          <Link className="sp-brand" to="/fa/articles">
            <div className="sp-brand-icon">
              <i className="bi bi-brain" />
            </div>
            روانشناسی ورزشی
          </Link>

          {/* Desktop links */}
          <ul className="sp-nav-links">
            <NavLinks />
          </ul>

          <div className="sp-nav-spacer" />

          {/* Desktop auth / user */}
          <div className="sp-nav-auth">
            {user ? (
              <div className="sp-user-info">
                <div className="sp-avatar">{initials()}</div>
                <div className="d-none d-md-block">
                  <div className="sp-user-name">{displayName()}</div>
                </div>
                <span className={`role-badge ${user.role}`}>
                  {roleLabel[user.role]}
                </span>
                <button className="btn-nav-login" onClick={handleLogout}>
                  خروج
                </button>
              </div>
            ) : (
              <>
                <button className="btn-nav-login" onClick={() => setModal('login')}>
                  ورود
                </button>
                <button className="btn-nav-signup" onClick={() => setModal('signup')}>
                  ثبت نام
                </button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="sp-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="منو"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`sp-mobile-nav ${mobileOpen ? 'open' : ''}`} dir="rtl">
        <ul className="sp-nav-links d-flex flex-column" style={{ gap: '.15rem' }}>
          <NavLinks mobile onClose={() => setMobileOpen(false)} />
        </ul>
        <div className="sp-nav-auth">
          {user ? (
            <>
              <div className="sp-user-info mb-2">
                <div className="sp-avatar">{initials()}</div>
                <div className="sp-user-name">{displayName()}</div>
                <span className={`role-badge ${user.role}`}>{roleLabel[user.role]}</span>
              </div>
              <button
                className="btn-nav-login w-100 text-center"
                onClick={handleLogout}
              >
                خروج از حساب
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-nav-login w-100 text-center"
                onClick={() => { setMobileOpen(false); setModal('login') }}
              >
                ورود
              </button>
              <button
                className="btn-nav-signup w-100 text-center"
                onClick={() => { setMobileOpen(false); setModal('signup') }}
              >
                ثبت نام
              </button>
            </>
          )}
        </div>
      </div>

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
