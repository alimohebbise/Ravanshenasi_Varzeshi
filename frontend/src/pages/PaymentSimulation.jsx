import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../api/client'

export default function PaymentSimulation() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null) // 'success' | 'failure' | null

  useEffect(() => {
    client.get(`/shop/orders/${orderId}/`)
      .then(({ data }) => setOrder(data))
      .finally(() => setLoading(false))
  }, [orderId])

  async function simulate(outcome) {
    setProcessing(true)
    try {
      const { data } = await client.post(`/shop/orders/${orderId}/simulate-payment/`, { outcome })
      setOrder(data)
      setResult(outcome)
    } catch {
      // ignore — order stays in its current state
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="sp-loading" style={{ marginTop: 'var(--navbar-h)' }}>
        <div className="sp-spinner" />
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ marginTop: 'var(--navbar-h)' }} className="container py-4" dir="rtl">
        <div className="sp-empty">
          <div className="sp-empty-icon"><i className="bi bi-question-circle" /></div>
          <p>سفارش یافت نشد.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <div className="container py-5" style={{ maxWidth: 560 }}>
        <div className="sp-stat-card" style={{ display: 'block', textAlign: 'center' }}>
          <div className="sp-alert" style={{ background: 'var(--clr-warning-light)', color: 'var(--clr-warning)', display: 'inline-flex', marginBottom: '1.25rem' }}>
            <i className="bi bi-info-circle-fill" />
            این یک درگاه پرداخت شبیه‌سازی‌شده است — پرداخت واقعی انجام نمی‌شود.
          </div>

          <h4 className="fw-bold mb-1">پرداخت سفارش #{order.id}</h4>
          <p className="sp-price" style={{ fontSize: '1.5rem' }}>
            {Number(order.total_amount).toLocaleString('fa-IR')} تومان
          </p>

          {order.status === 'pending_payment' && (
            <div className="d-flex flex-column gap-2 mt-4">
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                disabled={processing}
                onClick={() => simulate('success')}
              >
                <i className="bi bi-check-circle" /> شبیه‌سازی پرداخت موفق
              </button>
              <button
                className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                disabled={processing}
                onClick={() => simulate('failure')}
              >
                <i className="bi bi-x-circle" /> شبیه‌سازی پرداخت ناموفق
              </button>
            </div>
          )}

          {order.status === 'paid' && (
            <div className="mt-4">
              <div className="sp-alert success mb-3">
                <i className="bi bi-check-circle-fill flex-shrink-0" />
                پرداخت با موفقیت انجام شد.
              </div>
              <button className="btn btn-primary" onClick={() => navigate(`/orders/${order.id}`)}>
                مشاهده سفارش
              </button>
            </div>
          )}

          {order.status === 'payment_failed' && (
            <div className="mt-4">
              <div className="sp-alert error mb-3">
                <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
                پرداخت ناموفق بود. موجودی کالاها آزاد شد؛ می‌توانید دوباره از سبد خرید اقدام کنید.
              </div>
              <Link to="/cart" className="btn btn-outline-primary">بازگشت به سبد خرید</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
