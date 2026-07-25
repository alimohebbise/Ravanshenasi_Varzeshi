import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useCart } from '../context/CartContext'
import NavDropdown from './NavDropdown'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isCoach = user?.role === 'coach'
  const isOwner = user?.role === 'owner'
  const canManageShop = isCoach || isOwner

  function handleLogout() {
    logout()
    setMobileOpen(false)
    navigate('/articles')
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

  return (
    <>
      <nav className="sp-navbar" dir="rtl">
        <div className="container">
          <Link className="sp-brand" to="/articles">
            <div className="sp-brand-icon">
              <i className="bi bi-brain" />
            </div>
            روانشناسی ورزشی
          </Link>

          {/* Desktop links */}
          <ul className="sp-nav-links">
            <li>
              <Link className="sp-nav-link" to="/articles">
                <i className="bi bi-newspaper" />
                مقالات
              </Link>
            </li>
            <li>
              <Link className="sp-nav-link" to="/posts">
                <i className="bi bi-grid-3x3-gap" />
                پست‌ها
              </Link>
            </li>
            <li>
              <Link className="sp-nav-link" to="/coaches">
                <i className="bi bi-people" />
                مربیان
              </Link>
            </li>
            <li>
              <NavDropdown
                trigger={
                  <span className="cart-badge">
                    <i className="bi bi-shop" />
                    فروشگاه
                    {itemCount > 0 && <span className="cart-badge-count">{itemCount}</span>}
                  </span>
                }
              >
                <Link className="sp-dropdown-link" to="/shop">
                  <i className="bi bi-grid" /> مشاهده فروشگاه
                </Link>
                <Link className="sp-dropdown-link" to="/cart">
                  <i className="bi bi-cart3" /> سبد خرید
                  {itemCount > 0 && <span className="cart-badge-count" style={{ position: 'static', marginInlineStart: 'auto' }}>{itemCount}</span>}
                </Link>
                {user && (
                  <Link className="sp-dropdown-link" to="/orders">
                    <i className="bi bi-receipt" /> سفارش‌های من
                  </Link>
                )}
                {canManageShop && (
                  <>
                    <hr className="sp-dropdown-divider" />
                    <Link className="sp-dropdown-link" to="/coach-products">
                      <i className="bi bi-bag" /> مدیریت محصولات
                    </Link>
                    <Link className="sp-dropdown-link" to="/coach-sales">
                      <i className="bi bi-truck" /> فروش‌ها
                    </Link>
                  </>
                )}
              </NavDropdown>
            </li>
            {user && (
              <li>
                <Link className="sp-nav-link accent" to="/saved">
                  <i className="bi bi-bookmark" />
                  ذخیره‌شده‌ها
                </Link>
              </li>
            )}
            {isCoach && (
              <>
                <li>
                  <Link className="sp-nav-link accent" to="/coach-dashboard">
                    <i className="bi bi-pencil-square" />
                    مدیریت پست‌ها
                  </Link>
                </li>
                <li>
                  <Link className="sp-nav-link accent" to={`/coaches/${user.id}`}>
                    <i className="bi bi-person-badge" />
                    صفحه عمومی
                  </Link>
                </li>
              </>
            )}
            {isOwner && (
              <li>
                <Link className="sp-nav-link accent" to="/coach-dashboard">
                  <i className="bi bi-pencil-square" />
                  داشبورد مربی
                </Link>
              </li>
            )}
          </ul>

          <div className="sp-nav-spacer" />

          {/* Desktop auth / user */}
          <div className="sp-nav-auth">
            {user ? (
              <NavDropdown
                menuClassName="sp-user-menu-panel"
                trigger={
                  <span className="sp-user-menu-trigger">
                    <span className="sp-avatar">{initials()}</span>
                    <span className="d-none d-md-block">
                      <span className="sp-user-name">{displayName()}</span>
                    </span>
                    <span className={`role-badge ${user.role}`}>{roleLabel[user.role]}</span>
                  </span>
                }
              >
                <Link className="sp-dropdown-link" to="/my-profile">
                  <i className="bi bi-person-vcard" /> پروفایل من
                </Link>
                {isOwner && (
                  <Link className="sp-dropdown-link" to="/admin-panel">
                    <i className="bi bi-shield-check" /> پنل مدیریت
                  </Link>
                )}
                <hr className="sp-dropdown-divider" />
                <button type="button" className="sp-dropdown-link danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-left" /> خروج از حساب
                </button>
              </NavDropdown>
            ) : (
              <>
                <button className="btn-nav-login" onClick={() => openAuthModal('login')}>
                  ورود
                </button>
                <button className="btn-nav-signup" onClick={() => openAuthModal('signup')}>
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
          <li>
            <Link className="sp-nav-link" to="/articles" onClick={() => setMobileOpen(false)}>
              <i className="bi bi-newspaper" />
              مقالات
            </Link>
          </li>
          <li>
            <Link className="sp-nav-link" to="/posts" onClick={() => setMobileOpen(false)}>
              <i className="bi bi-grid-3x3-gap" />
              پست‌ها
            </Link>
          </li>
          <li>
            <Link className="sp-nav-link" to="/coaches" onClick={() => setMobileOpen(false)}>
              <i className="bi bi-people" />
              مربیان
            </Link>
          </li>

          <div className="sp-mobile-section-label">فروشگاه</div>
          <li>
            <Link className="sp-nav-link" to="/shop" onClick={() => setMobileOpen(false)}>
              <i className="bi bi-grid" />
              مشاهده فروشگاه
            </Link>
          </li>
          <li>
            <Link className="sp-nav-link" to="/cart" onClick={() => setMobileOpen(false)}>
              <i className="bi bi-cart3" />
              سبد خرید
              {itemCount > 0 && <span className="role-badge owner" style={{ marginInlineStart: 'auto' }}>{itemCount}</span>}
            </Link>
          </li>
          {user && (
            <li>
              <Link className="sp-nav-link" to="/orders" onClick={() => setMobileOpen(false)}>
                <i className="bi bi-receipt" />
                سفارش‌های من
              </Link>
            </li>
          )}
          {canManageShop && (
            <>
              <li>
                <Link className="sp-nav-link" to="/coach-products" onClick={() => setMobileOpen(false)}>
                  <i className="bi bi-bag" />
                  مدیریت محصولات
                </Link>
              </li>
              <li>
                <Link className="sp-nav-link" to="/coach-sales" onClick={() => setMobileOpen(false)}>
                  <i className="bi bi-truck" />
                  فروش‌ها
                </Link>
              </li>
            </>
          )}

          {user && (
            <>
              <div className="sp-mobile-section-label">حساب کاربری</div>
              <li>
                <Link className="sp-nav-link accent" to="/saved" onClick={() => setMobileOpen(false)}>
                  <i className="bi bi-bookmark" />
                  ذخیره‌شده‌ها
                </Link>
              </li>
              <li>
                <Link className="sp-nav-link accent" to="/my-profile" onClick={() => setMobileOpen(false)}>
                  <i className="bi bi-person-vcard" />
                  پروفایل من
                </Link>
              </li>
              {isCoach && (
                <>
                  <li>
                    <Link className="sp-nav-link accent" to="/coach-dashboard" onClick={() => setMobileOpen(false)}>
                      <i className="bi bi-pencil-square" />
                      مدیریت پست‌ها
                    </Link>
                  </li>
                  <li>
                    <Link className="sp-nav-link accent" to={`/coaches/${user.id}`} onClick={() => setMobileOpen(false)}>
                      <i className="bi bi-person-badge" />
                      صفحه عمومی
                    </Link>
                  </li>
                </>
              )}
              {isOwner && (
                <>
                  <li>
                    <Link className="sp-nav-link accent" to="/coach-dashboard" onClick={() => setMobileOpen(false)}>
                      <i className="bi bi-pencil-square" />
                      داشبورد مربی
                    </Link>
                  </li>
                  <li>
                    <Link className="sp-nav-link accent" to="/admin-panel" onClick={() => setMobileOpen(false)}>
                      <i className="bi bi-shield-check" />
                      پنل مدیریت
                    </Link>
                  </li>
                </>
              )}
            </>
          )}
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
                onClick={() => { setMobileOpen(false); openAuthModal('login') }}
              >
                ورود
              </button>
              <button
                className="btn-nav-signup w-100 text-center"
                onClick={() => { setMobileOpen(false); openAuthModal('signup') }}
              >
                ثبت نام
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
