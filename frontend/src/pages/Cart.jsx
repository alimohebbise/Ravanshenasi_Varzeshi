import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, removeFromCart, updateQty, subtotal } = useCart()
  const navigate = useNavigate()

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <div className="sp-page-header">
        <div className="container">
          <h2 className="sp-page-title">سبد خرید</h2>
        </div>
      </div>

      <div className="container py-4">
        {items.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-cart-x" /></div>
            <p>سبد خرید شما خالی است.</p>
            <Link to="/shop" className="btn btn-primary">مشاهده فروشگاه</Link>
          </div>
        ) : (
          <>
            <div className="sp-table mb-4">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>قیمت واحد</th>
                    <th>تعداد</th>
                    <th>جمع</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td style={{ fontWeight: 600 }}>
                        <div className="d-flex align-items-center gap-2">
                          {item.snapshot.image && (
                            <img
                              src={item.snapshot.image}
                              alt=""
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            />
                          )}
                          {item.snapshot.title}
                        </div>
                      </td>
                      <td>{Number(item.snapshot.price).toLocaleString('fa-IR')} تومان</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <i className="bi bi-dash" />
                          </button>
                          <span style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                            disabled={item.snapshot.product_type === 'physical' && item.quantity >= (item.snapshot.stock ?? 0)}
                          >
                            <i className="bi bi-plus" />
                          </button>
                        </div>
                      </td>
                      <td className="sp-price">
                        {(item.snapshot.price * item.quantity).toLocaleString('fa-IR')} تومان
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div style={{ fontSize: '1.1rem' }}>
                جمع کل: <span className="sp-price" style={{ fontSize: '1.3rem' }}>
                  {subtotal.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <button
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                onClick={() => navigate('/checkout')}
              >
                ادامه فرآیند خرید <i className="bi bi-arrow-left" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
