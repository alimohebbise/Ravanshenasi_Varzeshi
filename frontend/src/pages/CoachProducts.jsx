import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const emptyForm = {
  title: '', description: '', product_type: 'digital_course',
  category_id: '', price: '', stock: '', status: 'draft', images: [],
}

export default function CoachProducts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isCoach = user?.role === 'coach' || user?.role === 'owner'
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/articles'); return }
    if (!isCoach) navigate('/my-profile')
  }, [user, isCoach, navigate])

  const loadProducts = useCallback(() => {
    setLoading(true)
    client.get('/shop/products/my/')
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user || !isCoach) return
    loadProducts()
    client.get('/shop/categories/').then(({ data }) => setCategories(data)).catch(() => {})
  }, [user, isCoach, loadProducts])

  function openCreate() {
    setEditing(null); setForm(emptyForm); setError(''); setShowModal(true)
  }

  function openEdit(product) {
    setEditing(product)
    setForm({
      title: product.title,
      description: product.description,
      product_type: product.product_type,
      category_id: product.category_id || '',
      price: product.price,
      stock: product.stock ?? '',
      status: product.status,
      images: [],
    })
    setError(''); setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault(); setError('')
    if (form.product_type === 'physical' && form.stock === '') {
      setError('برای کالای فیزیکی، تعیین موجودی الزامی است.')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('product_type', form.product_type)
      fd.append('price', form.price)
      fd.append('status', form.status)
      if (form.category_id) fd.append('category_id', form.category_id)
      if (form.product_type === 'physical') fd.append('stock', form.stock)
      form.images.forEach((img) => fd.append('images', img))

      if (editing) {
        await client.patch(`/shop/products/${editing.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await client.post('/shop/products/create/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setShowModal(false); loadProducts()
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'خطا رخ داد')
    } finally { setSaving(false) }
  }

  async function handleDelete(product) {
    if (!window.confirm(`محصول "${product.title}" حذف شود؟`)) return
    await client.delete(`/shop/products/${product.id}/`)
    loadProducts()
  }

  const publishedProducts = products.filter((p) => p.status === 'published')
  const outOfStock = products.filter((p) => p.status === 'published' && !p.is_in_stock)

  if (!user || !isCoach) return null

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }}>
      <div style={{ background: 'var(--clr-navy)', color: '#fff', padding: '2rem 0' }}>
        <div className="container d-flex align-items-center justify-content-between flex-wrap gap-3" dir="rtl">
          <div>
            <h2 style={{ color: '#fff', margin: '0 0 .2rem', fontWeight: 800 }}>مدیریت محصولات</h2>
            <p style={{ color: 'rgba(255,255,255,.5)', margin: 0, fontSize: '.88rem' }}>
              دوره‌ها و کالاهای خود را برای فروش مدیریت کنید
            </p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
            onClick={openCreate}
          >
            <i className="bi bi-plus-lg" /> محصول جدید
          </button>
        </div>
      </div>

      <div className="container py-4" dir="rtl">
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4">
            <div className="sp-stat-card">
              <div className="sp-stat-icon blue"><i className="bi bi-bag" /></div>
              <div>
                <div className="sp-stat-val">{products.length}</div>
                <div className="sp-stat-lbl">کل محصولات</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="sp-stat-card">
              <div className="sp-stat-icon green"><i className="bi bi-send-check" /></div>
              <div>
                <div className="sp-stat-val">{publishedProducts.length}</div>
                <div className="sp-stat-lbl">منتشر شده</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="sp-stat-card">
              <div className="sp-stat-icon yellow"><i className="bi bi-exclamation-triangle" /></div>
              <div>
                <div className="sp-stat-val">{outOfStock.length}</div>
                <div className="sp-stat-lbl">ناموجود</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="sp-loading"><div className="sp-spinner" /></div>
        ) : products.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-bag-plus" /></div>
            <p>هنوز محصولی ندارید.</p>
            <button className="btn btn-primary" onClick={openCreate}>اولین محصول را ثبت کنید</button>
          </div>
        ) : (
          <div className="sp-table">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>نوع</th>
                  <th>قیمت</th>
                  <th>موجودی</th>
                  <th>وضعیت</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.title}</td>
                    <td>{product.product_type === 'physical' ? 'کالای فیزیکی' : 'دوره آنلاین'}</td>
                    <td>{Number(product.price).toLocaleString('fa-IR')} تومان</td>
                    <td>{product.product_type === 'physical' ? product.stock : '—'}</td>
                    <td>
                      <span className={`sp-status ${product.status}`}>
                        {product.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                          onClick={() => openEdit(product)}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                          onClick={() => handleDelete(product)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="sp-modal-overlay" dir="rtl">
          <div className="sp-modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <button className="sp-modal-close" onClick={() => setShowModal(false)}>
              <i className="bi bi-x" />
            </button>
            <div className="sp-modal-header">
              <div className="sp-modal-icon">
                <i className={`bi ${editing ? 'bi-pencil-square' : 'bi-plus-circle'}`} />
              </div>
              <h5>{editing ? 'ویرایش محصول' : 'محصول جدید'}</h5>
            </div>

            {error && (
              <div className="sp-alert error mb-3">
                <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label">عنوان</label>
                <input
                  className="form-control" required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">توضیحات</label>
                <textarea
                  className="form-control" required rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label">نوع محصول</label>
                  <select
                    className="form-select"
                    value={form.product_type}
                    onChange={(e) => setForm((f) => ({ ...f, product_type: e.target.value }))}
                  >
                    <option value="digital_course">دوره آنلاین</option>
                    <option value="physical">کالای فیزیکی</option>
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">دسته‌بندی</label>
                  <select
                    className="form-select"
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  >
                    <option value="">بدون دسته‌بندی</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label">قیمت (تومان)</label>
                  <input
                    type="number" min="0" className="form-control" required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                {form.product_type === 'physical' && (
                  <div className="col-sm-6">
                    <label className="form-label">موجودی</label>
                    <input
                      type="number" min="0" className="form-control" required
                      value={form.stock}
                      onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <label className="form-label">تصاویر محصول (اختیاری)</label>
                  <input
                    type="file" multiple accept="image/*" className="form-control"
                    onChange={(e) => setForm((f) => ({ ...f, images: Array.from(e.target.files) }))}
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">وضعیت انتشار</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="draft">پیش‌نویس</option>
                    <option value="published">منتشر شده</option>
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setShowModal(false)}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-sm)', fontWeight: 700 }}
                  disabled={saving}
                >
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />ذخیره...</>
                    : <><i className="bi bi-check-lg me-1" />ذخیره محصول</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
