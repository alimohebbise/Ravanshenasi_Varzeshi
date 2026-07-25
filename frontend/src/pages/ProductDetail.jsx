import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useCart } from '../context/CartContext'

const TYPE_LABELS = { digital_course: 'دوره آنلاین', physical: 'کالای فیزیکی' }

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    client.get(`/shop/products/${id}/`)
      .then(({ data }) => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="sp-loading" style={{ marginTop: 'var(--navbar-h)' }}>
        <div className="sp-spinner" />
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ marginTop: 'var(--navbar-h)' }} className="container py-4" dir="rtl">
        <div className="sp-empty">
          <div className="sp-empty-icon"><i className="bi bi-question-circle" /></div>
          <p>محصول یافت نشد.</p>
        </div>
      </div>
    )
  }

  const maxQty = product.product_type === 'physical' ? (product.stock ?? 0) : 99

  function handleAddToCart() {
    addToCart(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-md-6">
            {product.images.length > 0 ? (
              <>
                <img
                  src={product.images[activeImage].image}
                  alt={product.title}
                  style={{
                    width: '100%', height: 360, objectFit: 'cover',
                    borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border)',
                  }}
                />
                {product.images.length > 1 && (
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    {product.images.map((img, idx) => (
                      <img
                        key={img.id}
                        src={img.image}
                        alt=""
                        onClick={() => setActiveImage(idx)}
                        style={{
                          width: 64, height: 64, objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          border: idx === activeImage ? '2px solid var(--clr-accent)' : '1px solid var(--clr-border)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="sp-post-card-placeholder" style={{ height: 360, borderRadius: 'var(--radius-lg)' }}>
                <i className={`bi ${product.product_type === 'physical' ? 'bi-box-seam' : 'bi-mortarboard'}`} />
              </div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <span className={`sp-status ${product.is_in_stock ? 'published' : 'out-of-stock'} mb-2`}>
              {product.is_in_stock ? TYPE_LABELS[product.product_type] : 'ناموجود'}
            </span>
            <h2 style={{ fontWeight: 800, margin: '.5rem 0' }}>{product.title}</h2>
            <Link
              to={`/coaches/${product.coach_id}`}
              style={{ color: 'var(--clr-accent)', fontSize: '.88rem', fontWeight: 600, textDecoration: 'none' }}
            >
              <i className="bi bi-person-badge me-1" />{product.coach_name}
            </Link>

            <p style={{ color: 'var(--clr-text-2)', lineHeight: 1.8, margin: '1.25rem 0' }}>
              {product.description}
            </p>

            <div className="sp-price" style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>
              {Number(product.price).toLocaleString('fa-IR')} تومان
            </div>

            {product.product_type === 'physical' && (
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '.85rem', marginBottom: '1rem' }}>
                موجودی: {product.is_in_stock ? `${product.stock} عدد` : 'ناموجود'}
              </div>
            )}

            {product.is_in_stock ? (
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <i className="bi bi-dash" />
                  </button>
                  <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={quantity >= maxQty}
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  >
                    <i className="bi bi-plus" />
                  </button>
                </div>
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                  onClick={handleAddToCart}
                >
                  <i className="bi bi-cart-plus" />
                  {added ? 'به سبد اضافه شد' : 'افزودن به سبد خرید'}
                </button>
              </div>
            ) : (
              <div className="sp-alert error" style={{ display: 'inline-flex' }}>
                <i className="bi bi-exclamation-circle-fill" />
                این محصول در حال حاضر موجود نیست.
              </div>
            )}

            {added && (
              <div className="mt-3">
                <button className="btn btn-link p-0" onClick={() => navigate('/cart')}>
                  مشاهده سبد خرید <i className="bi bi-arrow-left" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
