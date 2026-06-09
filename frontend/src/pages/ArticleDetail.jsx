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
    <div>
      <div className="article-topbar" dir={isRtl ? 'rtl' : 'ltr'}>
        <Link to={`/${lang}/articles`} className="article-back-btn">
          <i className={`bi bi-arrow-${isRtl ? 'right' : 'left'}`} />
          {isRtl ? 'بازگشت' : 'Back'}
        </Link>
        {article && (
          <span className="article-topbar-title">{article.title}</span>
        )}
      </div>
      <div className="article-frame-wrap">
        <iframe
          src={`/${lang}/${slug}.html`}
          title={article?.title || slug}
          className="article-frame"
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      </div>
    </div>
  )
}
