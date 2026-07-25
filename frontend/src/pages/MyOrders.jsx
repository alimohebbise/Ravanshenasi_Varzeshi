import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

const STATUS_LABELS = {
  pending_payment: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  payment_failed: 'پرداخت ناموفق',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
}

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/shop/orders/')
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <div className="sp-page-header">
        <div className="container">
          <h2 className="sp-page-title">سفارش‌های من</h2>
        </div>
      </div>

      <div className="container py-4">
        {loading ? (
          <div className="sp-loading"><div className="sp-spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-receipt" /></div>
            <p>هنوز سفارشی ثبت نکرده‌اید.</p>
            <Link to="/shop" className="btn btn-primary">مشاهده فروشگاه</Link>
          </div>
        ) : (
          <div className="sp-table">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>شماره سفارش</th>
                  <th>مبلغ</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.id}</td>
                    <td>{Number(order.total_amount).toLocaleString('fa-IR')} تومان</td>
                    <td>
                      <span className={`sp-status ${order.status}`}>{STATUS_LABELS[order.status]}</span>
                    </td>
                    <td style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem' }}>
                      {new Date(order.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td>
                      <Link to={`/orders/${order.id}`} className="btn btn-sm btn-outline-primary" style={{ borderRadius: 'var(--radius-sm)' }}>
                        جزئیات
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
