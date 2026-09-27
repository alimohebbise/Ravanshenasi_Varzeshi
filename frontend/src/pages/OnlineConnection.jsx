import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function OnlineConnection() {
  const { user } = useAuth()
  const [recipients, setRecipients] = useState([])
  const [recipientsLoading, setRecipientsLoading] = useState(true)
  const [recipientsError, setRecipientsError] = useState(false)
  const [threads, setThreads] = useState([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsError, setThreadsError] = useState(false)
  const [activeFolder, setActiveFolder] = useState('received')
  const [expandedThread, setExpandedThread] = useState(null)
  const [showComposer, setShowComposer] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    recipient: '',
    subject: '',
    message: '',
  })
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)

  useEffect(() => {
    client.get('/auth/message-recipients/')
      .then(({ data }) => setRecipients(data))
      .catch(() => setRecipientsError(true))
      .finally(() => setRecipientsLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
    setForm((current) => ({
      ...current,
      name: current.name || fullName || user.username || '',
      email: current.email || user.email || '',
    }))

    setThreadsLoading(true)
    client.get('/auth/contact-messages/threads/')
      .then(({ data }) => setThreads(data))
      .catch(() => setThreadsError(true))
      .finally(() => setThreadsLoading(false))
  }, [user])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function chooseRecipient(recipient) {
    setSelectedRecipient(recipient)
    setForm((current) => ({ ...current, recipient: String(recipient.id) }))
    setFeedback(null)
  }

  async function loadThreads() {
    const { data } = await client.get('/auth/contact-messages/threads/')
    setThreads(data)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)
    setSubmitting(true)

    const payload = {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      recipient: Number(form.recipient),
    }

    try {
      await client.post('/auth/online-connection/', payload)
      setForm((current) => ({ ...current, subject: '', message: '', recipient: '' }))
      setShowComposer(false)
      setSelectedRecipient(null)
      if (user) {
        await loadThreads()
        setActiveFolder('sent')
      }
      setFeedback({
        type: 'success',
        message: 'پیام شما ارسال شد.',
      })
    } catch (error) {
      const details = error.response?.data
      const validationMessage = details && Object.values(details).flat().join(' ')
      setFeedback({
        type: 'error',
        message: validationMessage || 'ارسال پیام انجام نشد. لطفاً دوباره تلاش کنید.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReply(event, threadId) {
    event.preventDefault()
    if (!replyText.trim()) return
    setReplyingTo(threadId)
    try {
      await client.post(`/auth/contact-messages/${threadId}/reply/`, { message: replyText })
      setReplyText('')
      await loadThreads()
    } catch (error) {
      const details = error.response?.data
      const validationMessage = details && Object.values(details).flat().join(' ')
      setFeedback({
        type: 'error',
        message: validationMessage || 'پاسخ ارسال نشد. لطفاً دوباره تلاش کنید.',
      })
    } finally {
      setReplyingTo(null)
    }
  }

  const displayedThreads = user
    ? threads.filter((thread) => activeFolder === 'sent' ? thread.user === user.id : thread.user !== user.id)
    : []

  return (
    <main dir="rtl" style={{ marginTop: 'var(--navbar-h)' }}>
      <header style={{ background: 'var(--clr-navy)', color: '#fff', padding: '2rem 0' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontSize: '1.7rem', fontWeight: 800, marginBottom: '.35rem' }}>
            <i className="bi bi-chat-dots me-2" />ارتباط آنلاین
          </h1>
          <p style={{ color: 'rgba(255,255,255,.65)', margin: 0 }}>
            با مدیر سایت یا مربی موردنظرتان در ارتباط باشید.
          </p>
        </div>
      </header>

      <div className="container py-5">
        {feedback && (
          <div
            className={`sp-alert ${feedback.type === 'error' ? 'error' : 'success'} mb-4`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {feedback.message}
          </div>
        )}

        <section className="sp-card p-3 p-md-4 mb-4" aria-labelledby="new-message-title">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 id="new-message-title" className="h5 mb-1">ارسال پیام</h2>
              <p className="mb-0" style={{ color: 'var(--clr-text-muted)' }}>ابتدا مدیر یا مربی موردنظر را انتخاب کنید.</p>
            </div>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                setShowComposer((open) => !open)
                setSelectedRecipient(null)
                setForm((current) => ({ ...current, recipient: '' }))
              }}
            >
              <i className={`bi ${showComposer ? 'bi-x-lg' : 'bi-pencil-square'} me-2`} />
              {showComposer ? 'بستن' : 'پیام جدید'}
            </button>
          </div>

          {showComposer && (
            <div className="mt-4">
              {recipientsLoading ? (
                <div className="sp-loading py-3"><div className="sp-spinner" /></div>
              ) : recipientsError ? (
                <div className="sp-alert error" role="alert">فهرست گیرندگان بارگذاری نشد. دوباره تلاش کنید.</div>
              ) : recipients.length === 0 ? (
                <p className="mb-0" style={{ color: 'var(--clr-text-muted)' }}>گیرنده‌ای برای انتخاب وجود ندارد.</p>
              ) : (
                <>
                  <div className="d-flex flex-wrap gap-2" role="list" aria-label="فهرست مدیران و مربیان">
                    {recipients.map((recipient) => (
                      <button
                        key={recipient.id}
                        type="button"
                        className={`btn ${selectedRecipient?.id === recipient.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => chooseRecipient(recipient)}
                      >
                        <i className={`bi ${recipient.role === 'coach' ? 'bi-person-video3' : 'bi-shield-lock'} me-2`} />
                        {recipient.name}
                        <span className="ms-2 small">{recipient.role === 'coach' ? 'مربی' : 'مدیر'}</span>
                      </button>
                    ))}
                  </div>

                  {selectedRecipient && (
                    <form className="mt-4" onSubmit={handleSubmit}>
                      <p className="mb-3" style={{ color: 'var(--clr-text-2)' }}>
                        گیرنده: <strong>{selectedRecipient.name}</strong>
                      </p>
                      <div className="row g-3">
                        {!user && (
                          <>
                            <div className="col-sm-6">
                              <label className="form-label" htmlFor="contact-name">نام</label>
                              <input id="contact-name" className="form-control" name="name" autoComplete="name" maxLength={150} value={form.name} onChange={updateField} required />
                            </div>
                            <div className="col-sm-6">
                              <label className="form-label" htmlFor="contact-email">ایمیل</label>
                              <input id="contact-email" className="form-control" type="email" name="email" autoComplete="email" value={form.email} onChange={updateField} required />
                            </div>
                          </>
                        )}
                        <div className="col-12">
                          <label className="form-label" htmlFor="contact-subject">موضوع</label>
                          <input id="contact-subject" className="form-control" name="subject" maxLength={150} value={form.subject} onChange={updateField} required />
                        </div>
                        <div className="col-12">
                          <label className="form-label" htmlFor="contact-message">پیام</label>
                          <textarea id="contact-message" className="form-control" name="message" rows={5} value={form.message} onChange={updateField} required />
                        </div>
                        <div className="col-12">
                          <button className="btn btn-dark" disabled={submitting}>
                            {submitting
                              ? <><span className="spinner-border spinner-border-sm me-2" />در حال ارسال...</>
                              : <><i className="bi bi-send me-2" />ارسال پیام</>}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {user ? (
          <section aria-labelledby="message-history-title">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
              <h2 id="message-history-title" className="h5 mb-0">پیام‌های من</h2>
              <div className="sp-tabs" role="tablist" aria-label="پوشه پیام‌ها">
                {[
                  { id: 'received', label: 'دریافتی', icon: 'bi-inbox' },
                  { id: 'sent', label: 'ارسالی', icon: 'bi-send' },
                ].map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    role="tab"
                    aria-selected={activeFolder === folder.id}
                    className={`sp-tab-btn ${activeFolder === folder.id ? 'active' : ''}`}
                    onClick={() => setActiveFolder(folder.id)}
                  >
                    <i className={`bi ${folder.icon} me-1`} />{folder.label}
                    <span className="ms-1">({threads.filter((thread) => folder.id === 'sent' ? thread.user === user.id : thread.user !== user.id).length.toLocaleString('fa-IR')})</span>
                  </button>
                ))}
              </div>
            </div>

            {threadsLoading ? (
              <div className="sp-loading py-4"><div className="sp-spinner" /></div>
            ) : threadsError ? (
              <div className="sp-alert error" role="alert">بارگذاری پیام‌ها انجام نشد. صفحه را دوباره بارگذاری کنید.</div>
            ) : displayedThreads.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon"><i className="bi bi-chat-square-text" /></div>
                <p>{activeFolder === 'sent' ? 'پیام ارسالی ندارید.' : 'پیام دریافتی ندارید.'}</p>
              </div>
            ) : (
              displayedThreads.map((thread) => {
                const isSent = thread.user === user.id
                const isExpanded = expandedThread === thread.id
                const contactName = isSent ? (thread.recipient_name || thread.recipient_coach_name || 'مدیر سایت') : (thread.sender_name || thread.name)
                return (
                  <article key={thread.id} className="sp-card mb-3">
                    <button
                      type="button"
                      className="w-100 text-start border-0 bg-transparent p-3 p-md-4"
                      aria-expanded={isExpanded}
                      onClick={() => {
                        setExpandedThread(isExpanded ? null : thread.id)
                        setReplyText('')
                      }}
                    >
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <div>
                          <h3 className="h6 mb-1">{thread.subject}</h3>
                          <div style={{ color: 'var(--clr-text-muted)', fontSize: '.86rem' }}>
                            {isSent ? 'به' : 'از'} {contactName} · {new Date(thread.created_at).toLocaleDateString('fa-IR')}
                          </div>
                        </div>
                        <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 px-md-4 pb-4">
                        <div className="p-3 rounded" style={{ background: 'var(--clr-bg-2, #f6f7f8)' }}>
                          <div className="fw-semibold mb-2">{thread.sender_name || thread.name}</div>
                          <p className="mb-0" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{thread.message}</p>
                        </div>
                        {(thread.replies || []).map((reply) => (
                          <div key={reply.id} className="p-3 mt-2 rounded" style={{ background: 'var(--clr-bg-2, #f6f7f8)' }}>
                            <div className="d-flex justify-content-between gap-2 mb-2">
                              <strong>{reply.sender_name}</strong>
                              <span style={{ color: 'var(--clr-text-muted)', fontSize: '.8rem' }}>{new Date(reply.created_at).toLocaleDateString('fa-IR')}</span>
                            </div>
                            <p className="mb-0" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{reply.message}</p>
                          </div>
                        ))}
                        {thread.user && (
                          <form className="mt-3" onSubmit={(event) => handleReply(event, thread.id)}>
                            <label className="form-label" htmlFor={`reply-${thread.id}`}>پاسخ</label>
                            <div className="d-flex flex-column flex-sm-row gap-2">
                              <textarea
                                id={`reply-${thread.id}`}
                                className="form-control"
                                rows={2}
                                value={replyText}
                                onChange={(event) => setReplyText(event.target.value)}
                                required
                              />
                              <button className="btn btn-outline-primary align-self-sm-end" disabled={replyingTo === thread.id}>
                                <i className="bi bi-reply me-1" />ارسال پاسخ
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </section>
        ) : (
          <div className="sp-alert success" role="status">برای مشاهده پیام‌های ارسالی و دریافتی، وارد حساب کاربری خود شوید.</div>
        )}
        </div>
    </main>
  )
}