import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { useCart } from '../context/CartContext'
import client from '../api/client'

const emptyShipping = {
  shipping_full_name: '', shipping_phone: '', shipping_province: '',
  shipping_city: '', shipping_address_line: '', shipping_postal_code: '',
}

export default function Checkout() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { items, subtotal, hasPhysicalItems, clearCart } = useCart()
  const navigate = useNavigate()
  const [shipping, setShipping] = useState(emptyShipping)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    return (
      <div style={{ marginTop: 'var(--navbar-h)' }} className="container py-4" dir="rtl">
        <div className="sp-empty">
          <div className="sp-empty-icon"><i className="bi bi-cart-x" /></div>
          <p>سبد خرید شما خالی است.</p>
          <Link to="/shop" className="btn btn-primary">مشاهده فروشگاه</Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ marginTop: 'var(--navbar-h)' }} className="container py-4" dir="rtl">
        <div className="sp-empty">
          <div className="sp-empty-icon"><i className="bi bi-person-lock" /></div>
          <p>برای ادامه فرآیند خرید ابتدا وارد حساب کاربری خود شوید.</p>
          <button className="btn btn-primary" onClick={() => openAuthModal('login')}>ورود</button>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (hasPhysicalItems && !shipping.shipping_address_line.trim()) {
      setError('برای سفارش شامل کالای فیزیکی، آدرس ارسال الزامی است.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        ...shipping,
      }
      const { data } = await client.post('/shop/checkout/', payload)
      clearCart()
      navigate(`/checkout/payment/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت سفارش رخ داد.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <div className="sp-page-header">
        <div className="container">
          <h2 className="sp-page-title">تکمیل خرید</h2>
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-md-7">
            {error && (
              <div className="sp-alert error mb-3">
                <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {hasPhysicalItems && (
                <>
                  <h6 className="fw-bold mb-3">آدرس ارسال</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-sm-6">
                      <label className="form-label">نام و نام خانوادگی</label>
                      <input
                        className="form-control" required
                        value={shipping.shipping_full_name}
                        onChange={(e) => setShipping((s) => ({ ...s, shipping_full_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">شماره تماس</label>
                      <input
                        className="form-control" required
                        value={shipping.shipping_phone}
                        onChange={(e) => setShipping((s) => ({ ...s, shipping_phone: e.target.value }))}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">استان</label>
                      <input
                        className="form-control" required
                        value={shipping.shipping_province}
                        onChange={(e) => setShipping((s) => ({ ...s, shipping_province: e.target.value }))}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">شهر</label>
                      <input
                        className="form-control" required
                        value={shipping.shipping_city}
                        onChange={(e) => setShipping((s) => ({ ...s, shipping_city: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">آدرس کامل</label>
                      <textarea
                        className="form-control" required rows={3}
                        value={shipping.shipping_address_line}
                        onChange={(e) => setShipping((s) => ({ ...s, shipping_address_line: e.target.value }))}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">کد پستی</label>
                      <input
                        className="form-control"
                        value={shipping.shipping_postal_code}
                        onChange={(e) => setShipping((s) => ({ ...s, shipping_postal_code: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                disabled={submitting}
              >
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" />در حال ثبت سفارش...</>
                  : <>ثبت سفارش و رفتن به درگاه پرداخت <i className="bi bi-arrow-left" /></>
                }
              </button>
            </form>
          </div>

          <div className="col-12 col-md-5">
            <div className="sp-stat-card" style={{ display: 'block' }}>
              <h6 className="fw-bold mb-3">خلاصه سفارش</h6>
              {items.map((item) => (
                <div key={item.productId} className="d-flex justify-content-between mb-2" style={{ fontSize: '.88rem' }}>
                  <span>{item.snapshot.title} × {item.quantity}</span>
                  <span>{(item.snapshot.price * item.quantity).toLocaleString('fa-IR')} تومان</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between">
                <span className="fw-bold">جمع کل</span>
                <span className="sp-price">{subtotal.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
