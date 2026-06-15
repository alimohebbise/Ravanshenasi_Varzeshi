import { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { getThumbnail, stripHtml, PostModal } from './PostCard'
import CommentSection from './CommentSection'
import SaveCategoryModal from './SaveCategoryModal'

function coachInitials(post) {
  const name = post.coach_name || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`
  return name[0] || '?'
}

export default function InstaPostCard({ post }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [liked, setLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [commentCount, setCommentCount] = useState(post.comment_count)
  const [isSaved, setIsSaved] = useState(post.is_saved)
  const [savedCategoryId, setSavedCategoryId] = useState(post.saved_category_id)

  const [showComments, setShowComments] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showFull, setShowFull] = useState(false)

  const thumb = getThumbnail(post)
  const caption = stripHtml(post.content)

  function requireAuth() {
    openAuthModal('login')
  }

  async function toggleLike() {
    if (!user) return requireAuth()
    try {
      const { data } = await client.post(`/posts/${post.id}/like/`)
      setLiked(data.liked)
      setLikeCount(data.like_count)
    } catch {
      // ignore
    }
  }

  function toggleComments() {
    if (!user) return requireAuth()
    setShowComments((v) => !v)
  }

  function handleSaveClick() {
    if (!user) return requireAuth()
    setShowSaveModal(true)
  }

  function handleSaveChange(result) {
    setIsSaved(result.saved)
    setSavedCategoryId(result.category_id)
  }

  return (
    <article className="sp-insta-card">
      <div className="sp-insta-header">
        <Link to={`/coaches/${post.coach_id}`} className="sp-insta-coach">
          <div className="sp-coach-avatar sm">{coachInitials(post)}</div>
          <div>
            <div className="sp-insta-coach-name">{post.coach_name}</div>
            <div className="sp-insta-date">{new Date(post.created_at).toLocaleDateString('fa-IR')}</div>
          </div>
        </Link>
      </div>

      {thumb ? (
        <img className="sp-insta-image" src={thumb} alt={post.title} onClick={() => setShowFull(true)} />
      ) : (
        <div className="sp-insta-image sp-post-card-placeholder" onClick={() => setShowFull(true)}>
          <i className="bi bi-journal-richtext" />
        </div>
      )}

      <div className="sp-insta-actions">
        <button className={`sp-insta-action ${liked ? 'liked' : ''}`} onClick={toggleLike} aria-label="لایک">
          <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`} />
        </button>
        <button className="sp-insta-action" onClick={toggleComments} aria-label="نظرات">
          <i className="bi bi-chat" />
        </button>
        <button className={`sp-insta-action ${isSaved ? 'saved' : ''}`} onClick={handleSaveClick} aria-label="ذخیره">
          <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`} />
        </button>
      </div>

      <div className="sp-insta-body">
        {likeCount > 0 && (
          <div className="sp-insta-like-count">{likeCount.toLocaleString('fa-IR')} پسند</div>
        )}
        <div className="sp-insta-caption">
          <strong>{post.title}</strong>
          {caption && <span> — {caption.length > 140 ? `${caption.slice(0, 140)}…` : caption}</span>}
          {caption.length > 140 && (
            <button className="sp-insta-more" onClick={() => setShowFull(true)}>نمایش بیشتر</button>
          )}
        </div>
        {commentCount > 0 && (
          <button className="sp-insta-comment-toggle" onClick={toggleComments}>
            مشاهده {commentCount.toLocaleString('fa-IR')} نظر
          </button>
        )}
      </div>

      {showComments && (
        <CommentSection postId={post.id} onCommentAdded={() => setCommentCount((c) => c + 1)} />
      )}

      {showFull && <PostModal post={post} onClose={() => setShowFull(false)} />}

      {showSaveModal && (
        <SaveCategoryModal
          postId={post.id}
          isSaved={isSaved}
          categoryId={savedCategoryId}
          onClose={() => setShowSaveModal(false)}
          onChange={handleSaveChange}
        />
      )}
    </article>
  )
}
