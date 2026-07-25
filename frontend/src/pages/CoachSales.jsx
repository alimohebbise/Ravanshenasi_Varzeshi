import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const FULFILLMENT_LABELS = {
  not_applicable: '—',
  pending: 'در انتظار',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
}

export default function CoachSales() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isCoach = user?.role === 'coach' || user?.role === 'owner'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/articles'); return }
    if (!isCoach) navigate('/my-profile')
  }, [user, isCoach, navigate])

  const loadSales = useCallback(() => {
    setLoading(true)
    client.get('/shop/sales/')
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user || !isCoach) return
    loadSales()
  }, [user, isCoach, loadSales])

  async function handleStatusChange(item, fulfillment_status) {
    setUpdating(item.id)
    try {
      await client.patch(`/shop/sales/${item.id}/fulfillment/`, { fulfillment_status })
      loadSales()
    } catch {
      // ignore
    } finally {
      setUpdating(null)
    }
  }

  if (!user || !isCoach) return null

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }}>
      <div style={{ background: 'var(--clr-navy)', color: '#fff', padding: '2rem 0' }}>
        <div className="container" dir="rtl">
          <h2 style={{ color: '#fff', margin: '0 0 .2rem', fontWeight: 800 }}>فروش‌ها</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', margin: 0, fontSize: '.88rem' }}>
            سفارش‌های محصولات شما و وضعیت ارسال آن‌ها
          </p>
        </div>
      </div>

      <div className="container py-4" dir="rtl">
        {loading ? (
          <div className="sp-loading"><div className="sp-spinner" /></div>
        ) : items.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-truck" /></div>
            <p>هنوز فروشی ثبت نشده است.</p>
          </div>
        ) : (
          <div className="sp-table">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>محصول</th>
                  <th>خریدار</th>
                  <th>تعداد</th>
                  <th>مبلغ</th>
                  <th>وضعیت ارسال</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.product_title_snapshot}</td>
                    <td>سفارش #{item.id}</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.unit_price_snapshot * item.quantity).toLocaleString('fa-IR')} تومان</td>
                    <td>
                      {item.fulfillment_status === 'not_applicable' ? (
                        <span className="sp-status not_applicable">—</span>
                      ) : (
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 'auto', display: 'inline-block' }}
                          value={item.fulfillment_status}
                          disabled={updating === item.id}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                        >
                          <option value="pending" disabled>در انتظار</option>
                          <option value="processing">در حال آماده‌سازی</option>
                          <option value="shipped">ارسال شده</option>
                          <option value="delivered">تحویل داده شده</option>
                        </select>
                      )}
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
