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

  if (loading) {
    return (
      <div className="text-center py-5" style={{ marginTop: '80px' }}>
        <div className="spinner-border" />
      </div>
    )
  }

  return (
    <div className="container py-4" style={{ marginTop: '70px' }} dir="rtl">
      <h3 className="fw-bold mb-4">مربیان</h3>

      {coaches.length === 0 ? (
        <p className="text-muted">مربی تأیید شده‌ای وجود ندارد.</p>
      ) : (
        <div className="row g-3">
          {coaches.map(coach => (
            <div key={coach.user_id} className="col-12 col-sm-6 col-md-4">
              <Link to={`/coaches/${coach.user_id}`} className="text-decoration-none">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <div
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold fs-4 mx-auto mb-3"
                      style={{ width: 64, height: 64 }}
                    >
                      {coach.first_name?.[0]}{coach.last_name?.[0]}
                    </div>
                    <h5 className="card-title mb-1">{coach.first_name} {coach.last_name}</h5>
                    {coach.expertise && (
                      <p className="text-muted small mb-2">{coach.expertise}</p>
                    )}
                    {coach.experience_years > 0 && (
                      <span className="badge bg-light text-dark">
                        {coach.experience_years} سال تجربه
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
