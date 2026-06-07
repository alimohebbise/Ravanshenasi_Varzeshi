import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ARTICLES, CATEGORIES } from '../data/articles'
import client from '../api/client'

export default function ArticleList() {
  const { lang = 'fa' } = useParams()
  const navigate = useNavigate()
  const isRtl = lang === 'fa'

  const [viewCounts, setViewCounts] = useState({})
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    client.get(`/articles/?lang=${lang}`)
      .then(({ data }) => {
        const map = {}
        data.forEach((a) => { map[a.slug] = a.view_count })
        setViewCounts(map)
      })
      .catch(() => {})
  }, [lang])

  const articles = ARTICLES[lang] || []
  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter((a) => a.category === activeCategory)

  function openArticle(article) {
    client.post(`/articles/${article.slug}/view/`, {
      language: lang,
      title: article.title,
      category: article.category,
    }).catch(() => {})
    navigate(`/${lang}/articles/${article.slug}`)
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="container py-4" style={{ marginTop: '70px' }}>
      <h2 className="mb-4 fw-bold">{isRtl ? 'مقالات آموزشی' : 'Educational Articles'}</h2>

      {/* Category filter */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          className={`btn btn-sm ${activeCategory === 'all' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => setActiveCategory('all')}
        >
          {isRtl ? 'همه' : 'All'}
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`btn btn-sm ${activeCategory === key ? `btn-${cat.color}` : `btn-outline-${cat.color}`}`}
            onClick={() => setActiveCategory(key)}
          >
            {isRtl ? cat.fa : cat.en}
          </button>
        ))}
      </div>

      <div className="row g-3">
        {filtered.map((article) => {
          const cat = CATEGORIES[article.category]
          return (
            <div key={article.slug} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div
                className="card article-card shadow-sm"
                onClick={() => openArticle(article)}
              >
                <div className="card-body d-flex flex-column">
                  <span className={`badge bg-${cat?.color || 'secondary'} category-badge mb-2 align-self-start`}>
                    {isRtl ? cat?.fa : cat?.en}
                  </span>
                  <h6 className="card-title flex-grow-1">{article.title}</h6>
                  <div className="text-muted small mt-2">
                    <i className="bi bi-eye me-1" />
                    {viewCounts[article.slug] ?? 0}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted">{isRtl ? 'مقاله‌ای یافت نشد.' : 'No articles found.'}</p>
      )}
    </div>
  )
}
