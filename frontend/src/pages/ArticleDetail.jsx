import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ARTICLES } from '../data/articles'
import client from '../api/client'

export default function ArticleDetail() {
  const { slug } = useParams()
  const articles = ARTICLES.fa
  const article = articles.find((a) => a.slug === slug)

  useEffect(() => {
    if (!article) return
    client.post(`/articles/${slug}/view/`, {
      language: 'fa',
      title: article.title,
      category: article.category,
    }).catch(() => {})
  }, [slug, article])

  return (
    <div>
      <div className="article-topbar" dir="rtl">
        <Link to="/articles" className="article-back-btn">
          <i className="bi bi-arrow-right" />
          بازگشت
        </Link>
        {article && (
          <span className="article-topbar-title">{article.title}</span>
        )}
      </div>
      <div className="article-frame-wrap">
        <iframe
          src={`/fa/${slug}.html`}
          title={article?.title || slug}
          className="article-frame"
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      </div>
    </div>
  )
}
