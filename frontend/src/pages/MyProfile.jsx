import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const STATUS_LABELS = { pending: 'در انتظار بررسی', approved: 'تأیید شده', rejected: 'رد شده' }

function InfoRow({ label, value }) {
  return (
    <div className="col-sm-6">
      <div style={{ color: 'var(--clr-text-muted)', fontSize: '.78rem', marginBottom: '.2rem' }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value || '—'}</div>
    </div>
  )
}

export default function MyProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [application, setApplication] = useState(undefined)

  useEffect(() => {
    if (!user) { navigate('/fa/articles'); return }
    client.get('/coaches/my-application/')
      .then(({ data }) => setApplication(data))
      .catch(() => setApplication(null))
  }, [user, navigate])

  if (!user) return null

  if (application === undefined) return (
    <div className="sp-loading" style={{ marginTop: 'var(--navbar-h)' }}>
      <div className="sp-spinner" />
    </div>
  )

  const isCoach = user.role === 'coach' || user.role === 'owner'
  const status = application?.status

  return (
    <div style={{ marginTop: 'var(--navbar-h)' }}>
      <div style={{ background: 'var(--clr-navy)', color: '#fff', padding: '2rem 0' }}>
        <div className="container" dir="rtl">
          <h2 style={{ color: '#fff', margin: '0 0 .2rem', fontWeight: 800 }}>پروفایل من</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', margin: 0, fontSize: '.88rem' }}>
            اطلاعات شخصی، مدارک و وضعیت درخواست مربیگری شما
          </p>
        </div>
      </div>

      <div className="container py-4" dir="rtl">
        <div className="mx-auto" style={{ maxWidth: 680 }}>
          {!application ? (
            <div className="sp-card p-5 text-center">
              <div
                className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'var(--clr-accent-light)', color: 'var(--clr-accent)', fontSize: '2.2rem',
                }}
              >
                <i className="bi bi-person-badge" />
              </div>
              <h5 className="fw-bold mb-2">هنوز مربی نیستید</h5>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '.9rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
                برای انتشار مقاله و دسترسی به امکانات مربیان، ابتدا درخواست مربیگری خود را برای مدیر ارسال کنید.
              </p>
              <Link
                to="/coach-application"
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
              >
                <i className="bi bi-send me-2" />ارسال درخواست مربیگری
              </Link>
            </div>
          ) : (
            <>
              {/* Status */}
              {!isCoach && (
                <div className="sp-card p-4 mb-3 d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: status === 'approved' ? 'var(--clr-success-light)'
                        : status === 'rejected' ? 'var(--clr-danger-light)'
                        : 'var(--clr-warning-light)',
                      color: status === 'approved' ? 'var(--clr-success)'
                        : status === 'rejected' ? 'var(--clr-danger)'
                        : 'var(--clr-warning)',
                      fontSize: '1.6rem',
                    }}
                  >
                    <i className={`bi ${
                      status === 'approved' ? 'bi-patch-check-fill'
                      : status === 'rejected' ? 'bi-x-octagon-fill'
                      : 'bi-hourglass-split'
                    }`} />
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ fontWeight: 700 }}>وضعیت درخواست مربیگری</span>
                      <span className={`sp-status ${status}`}>{STATUS_LABELS[status]}</span>
                    </div>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '.85rem', margin: 0 }}>
                      {status === 'approved'
                        ? 'تبریک! درخواست شما تأیید شده است. لطفاً از حساب کاربری خود خارج و دوباره وارد شوید تا امکانات مربیان فعال شود.'
                        : status === 'rejected'
                        ? 'متأسفانه درخواست شما رد شده است. برای اطلاعات بیشتر با مدیر تماس بگیرید.'
                        : 'درخواست شما در حال بررسی توسط مدیر است. پس از تأیید، امکانات مربیان برای شما فعال خواهد شد.'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Personal info */}
              <div className="sp-card p-4 mb-3">
                <div className="form-section-title">اطلاعات شخصی</div>
                <div className="row g-3">
                  <InfoRow label="نام" value={application.first_name} />
                  <InfoRow label="نام خانوادگی" value={application.last_name} />
                  <InfoRow label="نام کاربری" value={application.username} />
                  <InfoRow label="ایمیل" value={application.email} />
                  <InfoRow label="کد ملی" value={application.national_id} />
                  <InfoRow
                    label="تاریخ تولد"
                    value={application.date_of_birth && new Date(application.date_of_birth).toLocaleDateString('fa-IR')}
                  />
                </div>
              </div>

              {/* Professional info */}
              <div className="sp-card p-4 mb-3">
                <div className="form-section-title">اطلاعات حرفه‌ای</div>
                <div className="row g-3">
                  <InfoRow label="تخصص" value={application.expertise} />
                  <InfoRow label="سابقه" value={application.experience_years ? `${application.experience_years.toLocaleString('fa-IR')} سال` : null} />
                  <div className="col-12">
                    <div style={{ color: 'var(--clr-text-muted)', fontSize: '.78rem', marginBottom: '.2rem' }}>بیوگرافی</div>
                    <div style={{ fontWeight: 600, lineHeight: '1.8' }}>{application.bio || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="sp-card p-4 mb-3">
                <div className="form-section-title">مدارک و مستندات</div>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div style={{ color: 'var(--clr-text-muted)', fontSize: '.78rem', marginBottom: '.4rem' }}>مدارک تحصیلی</div>
                    {application.educational_documents ? (
                      <a href={application.educational_documents} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary" style={{ borderRadius: 'var(--radius-sm)' }}>
                        <i className="bi bi-file-earmark-arrow-down me-1" />مشاهده فایل
                      </a>
                    ) : '—'}
                  </div>
                  <div className="col-sm-6">
                    <div style={{ color: 'var(--clr-text-muted)', fontSize: '.78rem', marginBottom: '.4rem' }}>امضای دیجیتال</div>
                    {application.digital_signature ? (
                      <a href={application.digital_signature} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary" style={{ borderRadius: 'var(--radius-sm)' }}>
                        <i className="bi bi-file-earmark-arrow-down me-1" />مشاهده فایل
                      </a>
                    ) : '—'}
                  </div>
                </div>
              </div>

              {isCoach && (
                <div className="d-flex gap-2 flex-wrap">
                  <Link
                    to={`/coaches/${user.id}`}
                    className="btn btn-outline-primary"
                    style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                  >
                    <i className="bi bi-box-arrow-up-left me-2" />مشاهده صفحه عمومی
                  </Link>
                  <Link
                    to="/coach-dashboard"
                    className="btn btn-primary"
                    style={{ borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                  >
                    <i className="bi bi-pencil-square me-2" />مدیریت پست‌ها
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
