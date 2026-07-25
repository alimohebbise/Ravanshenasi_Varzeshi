import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

const TYPE_LABELS = { digital_course: 'دوره آنلاین', physical: 'کالای فیزیکی' }

export default function Shop() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    client.get('/shop/categories/')
      .then(({ data }) => setCategories(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (activeType) params.product_type = activeType
    if (activeCategory) params.category_id = activeCategory
    client.get('/shop/products/', { params })
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false))
  }, [activeType, activeCategory])

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }} dir="rtl">
      <div className="sp-page-header">
        <div className="container">
          <h2 className="sp-page-title">فروشگاه</h2>
          <p className="sp-page-subtitle">دوره‌های آموزشی و تجهیزات ورزشی مربیان را خریداری کنید</p>
        </div>
      </div>

      <div className="container py-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            className={`sp-filter-pill ${activeType === null ? 'active' : ''}`}
            onClick={() => setActiveType(null)}
          >
            همه محصولات
          </button>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              className={`sp-filter-pill ${activeType === value ? 'active' : ''}`}
              onClick={() => setActiveType(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-4">
            <button
              className={`sp-filter-pill ${activeCategory === null ? 'active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              همه دسته‌بندی‌ها
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`sp-filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <i className="bi bi-tag me-1" />{cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="sp-loading"><div className="sp-spinner" /></div>
        ) : products.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-shop" /></div>
            <p>محصولی یافت نشد.</p>
          </div>
        ) : (
          <div className="row g-3">
            {products.map((product) => (
              <div key={product.id} className="col-12 col-sm-6 col-md-4">
                <Link to={`/shop/${product.id}`} className="sp-post-card" style={{ cursor: 'pointer' }}>
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].image}
                      alt={product.title}
                      style={{ width: '100%', height: 180, objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="sp-post-card-placeholder">
                      <i className={`bi ${product.product_type === 'physical' ? 'bi-box-seam' : 'bi-mortarboard'}`} />
                    </div>
                  )}
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className={`sp-status ${product.is_in_stock ? 'published' : 'out-of-stock'}`}>
                        {product.is_in_stock ? TYPE_LABELS[product.product_type] : 'ناموجود'}
                      </span>
                    </div>
                    <h6 style={{ fontWeight: 700, marginBottom: '.4rem', color: 'var(--clr-text)' }}>
                      {product.title}
                    </h6>
                    <div style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem', marginBottom: '.5rem' }}>
                      <i className="bi bi-person-badge me-1" />{product.coach_name}
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="sp-price">{Number(product.price).toLocaleString('fa-IR')} تومان</span>
                    <span style={{ color: 'var(--clr-accent)', fontSize: '.82rem', fontWeight: 600 }}>
                      مشاهده <i className="bi bi-arrow-left" />
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
