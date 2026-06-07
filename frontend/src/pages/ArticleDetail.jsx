import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ARTICLES } from '../data/articles'
import client from '../api/client'

export default function ArticleDetail() {
  const { lang = 'fa', slug } = useParams()
  const isRtl = lang === 'fa'
  const articles = ARTICLES[lang] || []
  const article = articles.find((a) => a.slug === slug)

  useEffect(() => {
    if (!article) return
    client.post(`/articles/${slug}/view/`, {
      language: lang,
      title: article.title,
      category: article.category,
    }).catch(() => {})
  }, [slug, lang, article])

  return (
    <div style={{ marginTop: '70px' }}>
      <div className="bg-dark text-white py-2 px-3" dir={isRtl ? 'rtl' : 'ltr'}>
        <Link to={`/${lang}/articles`} className="text-white text-decoration-none small">
          <i className="bi bi-arrow-right me-1" />
          {isRtl ? 'بازگشت به مقالات' : 'Back to Articles'}
        </Link>
        {article && (
          <span className="ms-3 small opacity-75">{article.title}</span>
        )}
      </div>
      {/* Serve the existing HTML file through the Vite proxy → Django */}
      <iframe
        src={`/${lang}/${slug}.html`}
        title={article?.title || slug}
        className="article-frame"
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>
  )
}
