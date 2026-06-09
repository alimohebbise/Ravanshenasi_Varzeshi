import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

export default function CoachesList() {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/coaches/approved/')
      .then(({ data }) => setCoaches(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="sp-loading" style={{ marginTop: 'var(--navbar-h)' }}>
      <div className="sp-spinner" />
    </div>
  )

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }}>
      <div style={{ background: 'var(--clr-navy)', padding: '2.25rem 0' }}>
        <div className="container" dir="rtl">
          <h2 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>مربیان ما</h2>
          <p style={{ color: 'rgba(255,255,255,.55)', margin: '.25rem 0 0', fontSize: '.9rem' }}>
            متخصصان روانشناسی ورزشی تأیید شده
          </p>
        </div>
      </div>

      <div className="container py-4" dir="rtl">
        {coaches.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon"><i className="bi bi-people" /></div>
            <p>مربی تأیید شده‌ای وجود ندارد.</p>
          </div>
        ) : (
          <div className="row g-3">
            {coaches.map((coach) => (
              <div key={coach.user_id} className="col-12 col-sm-6 col-md-4">
                <Link to={`/coaches/${coach.user_id}`} className="sp-coach-card">
                  <div className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="sp-coach-avatar">
                        {coach.first_name?.[0]}{coach.last_name?.[0]}
                      </div>
                      <div>
                        <div className="fw-bold" style={{ color: 'var(--clr-text)', fontSize: '1rem' }}>
                          {coach.first_name} {coach.last_name}
                        </div>
                        {coach.expertise && (
                          <div style={{ color: 'var(--clr-text-muted)', fontSize: '.82rem', marginTop: '.1rem' }}>
                            {coach.expertise}
                          </div>
                        )}
                      </div>
                    </div>
                    {coach.bio && (
                      <p style={{
                        color: 'var(--clr-text-2)', fontSize: '.85rem', lineHeight: '1.6',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        margin: '0 0 .75rem',
                      }}>
                        {coach.bio}
                      </p>
                    )}
                    <div className="d-flex align-items-center justify-content-between">
                      {coach.experience_years > 0 ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                          background: 'var(--clr-teal-light)', color: 'var(--clr-teal)',
                          padding: '.2rem .7rem', borderRadius: 'var(--radius-full)',
                          fontSize: '.75rem', fontWeight: 700,
                        }}>
                          <i className="bi bi-award" />
                          {coach.experience_years} سال تجربه
                        </span>
                      ) : <span />}
                      <span style={{ color: 'var(--clr-accent)', fontSize: '.82rem', fontWeight: 600 }}>
                        مشاهده <i className="bi bi-arrow-left" />
                      </span>
                    </div>
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
