import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ARTICLES, CATEGORIES } from '../data/articles'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { PostCard, PostModal } from '../components/PostCard'

const CAT_ICON = {
  psychology:   'bi-brain',
  physiology:   'bi-heart-pulse',
  sports:       'bi-trophy',
  martial_arts: 'bi-shield',
}

export default function ArticleList() {
  const { lang = 'fa' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isRtl = lang === 'fa'

  const [viewCounts, setViewCounts] = useState({})
  const [activeCategory, setActiveCategory] = useState('all')
  const [posts, setPosts] = useState([])
  const [activePost, setActivePost] = useState(null)

  useEffect(() => {
    client.get(`/articles/?lang=${lang}`)
      .then(({ data }) => {
        const map = {}
        data.forEach((a) => { map[a.slug] = a.view_count })
        setViewCounts(map)
      })
      .catch(() => {})
  }, [lang])

  useEffect(() => {
    client.get('/posts/')
      .then(({ data }) => setPosts(data))
      .catch(() => {})
  }, [])

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

  const totalArticles = articles.length
  const catCount = Object.keys(CATEGORIES).length

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── Hero ── */}
      <section className="sp-hero">
        <div className="container sp-hero-content">
          <div className="sp-hero-eyebrow">
            <i className="bi bi-award-fill" />
            {isRtl ? 'متخصص روانشناسی ورزشی ما' : 'Our Sports Psychologist'}
          </div>
          <h1>
            {isRtl
              ? <><span>روانشناسی</span> ورزشی</>
              : <>Sports <span>Psychology</span></>
            }
          </h1>
          <p className="sp-hero-sub">
            {isRtl
              ? 'مجموعه‌ای جامع از مقالات علمی در حوزه روانشناسی و فیزیولوژی ورزش، مربیگری و هنرهای رزمی'
              : 'A comprehensive collection of scientific articles on sport psychology, physiology, coaching, and martial arts'
            }
          </p>

          {!user && (
            <div className="sp-hero-actions">
              <button
                className="btn btn-primary px-4 py-2"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                onClick={() => document.querySelector('.btn-nav-signup')?.click()}
              >
                <i className="bi bi-person-plus me-2" />
                {isRtl ? 'ثبت نام' : 'Sign Up'}
              </button>
              <button
                className="btn btn-nav-login px-4 py-2"
                style={{ borderRadius: 'var(--radius-md)' }}
                onClick={() => document.querySelector('.btn-nav-login')?.click()}
              >
                <i className="bi bi-box-arrow-in-right me-2" />
                {isRtl ? 'ورود' : 'Login'}
              </button>
            </div>
          )}

          <div className="sp-hero-stats">
            <div>
              <div className="sp-hero-stat-value">{totalArticles}</div>
              <div className="sp-hero-stat-label">{isRtl ? 'مقاله' : 'Articles'}</div>
            </div>
            <div>
              <div className="sp-hero-stat-value">{catCount}</div>
              <div className="sp-hero-stat-label">{isRtl ? 'دسته‌بندی' : 'Categories'}</div>
            </div>
            <div>
              <div className="sp-hero-stat-value">
                {Object.values(viewCounts).reduce((s, v) => s + v, 0).toLocaleString(isRtl ? 'fa-IR' : 'en')}
              </div>
              <div className="sp-hero-stat-label">{isRtl ? 'کل بازدید' : 'Total Views'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="container py-4">
        {/* Category filter */}
        <div className="sp-filter-wrap">
          <button
            className={`sp-filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <i className="bi bi-grid-3x3-gap" />
            {isRtl ? 'همه' : 'All'}
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              className={`sp-filter-pill cat-${key} ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              <i className={`bi ${CAT_ICON[key] ?? 'bi-tag'}`} />
              {isRtl ? cat.fa : cat.en}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-search" /></div>
            <p>{isRtl ? 'مقاله‌ای یافت نشد.' : 'No articles found.'}</p>
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map((article) => {
              const catKey = article.category
              const cat = CATEGORIES[catKey]
              return (
                <div key={article.slug} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div
                    className={`sp-card article-card cat-${catKey}`}
                    onClick={() => openArticle(article)}
                  >
                    <div className="cat-stripe" />
                    <div className="card-body d-flex flex-column">
                      <span className={`sp-cat-tag ${catKey} mb-2 align-self-start`}>
                        <i className={`bi ${CAT_ICON[catKey]} me-1`} />
                        {isRtl ? cat?.fa : cat?.en}
                      </span>
                      <h6 className="card-title flex-grow-1">{article.title}</h6>
                      <div className="sp-view-count mt-2">
                        <i className="bi bi-eye" />
                        {(viewCounts[article.slug] ?? 0).toLocaleString(isRtl ? 'fa-IR' : 'en')}
                        {isRtl ? ' بازدید' : ' views'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Coach posts ── */}
      {posts.length > 0 && (
        <div className="container py-4" dir="rtl">
          <h5 className="sp-section-title">
            {isRtl ? 'آخرین پست‌های مربیان' : 'Latest Coach Posts'}
          </h5>
          <div className="row g-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => setActivePost(post)} showCoach />
            ))}
          </div>
        </div>
      )}

      <PostModal post={activePost} onClose={() => setActivePost(null)} />
    </div>
  )
}
