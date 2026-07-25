import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

const FULFILLMENT_LABELS = {
  not_applicable: '—',
  pending: 'در انتظار',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
}

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get(`/shop/orders/${id}/`)
      .then(({ data }) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

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
          <p>سفارش یافت نشد یا دسترسی ندارید.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <div className="sp-page-header">
        <div className="container d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h2 className="sp-page-title">سفارش #{order.id}</h2>
          <span className={`sp-status ${order.status}`}>{STATUS_LABELS[order.status]}</span>
        </div>
      </div>

      <div className="container py-4">
        <div className="sp-table mb-4">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>محصول</th>
                <th>فروشنده</th>
                <th>قیمت واحد</th>
                <th>تعداد</th>
                <th>وضعیت ارسال</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.product_title_snapshot}</td>
                  <td>{item.coach_name}</td>
                  <td>{Number(item.unit_price_snapshot).toLocaleString('fa-IR')} تومان</td>
                  <td>{item.quantity}</td>
                  <td>
                    <span className={`sp-status ${item.fulfillment_status}`}>
                      {FULFILLMENT_LABELS[item.fulfillment_status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row g-4">
          {order.has_physical_items && (
            <div className="col-12 col-md-6">
              <div className="sp-stat-card" style={{ display: 'block' }}>
                <h6 className="fw-bold mb-3">آدرس ارسال</h6>
                <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--clr-text-2)', lineHeight: 1.8 }}>
                  {order.shipping_full_name} — {order.shipping_phone}<br />
                  {order.shipping_province}، {order.shipping_city}<br />
                  {order.shipping_address_line}
                  {order.shipping_postal_code && <><br />کد پستی: {order.shipping_postal_code}</>}
                </p>
              </div>
            </div>
          )}
          <div className="col-12 col-md-6">
            <div className="sp-stat-card" style={{ display: 'block' }}>
              <h6 className="fw-bold mb-3">مبلغ کل</h6>
              <span className="sp-price" style={{ fontSize: '1.3rem' }}>
                {Number(order.total_amount).toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
