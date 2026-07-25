import { useEffect, useRef, useState } from 'react'

export default function NavDropdown({ trigger, children, menuClassName = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="sp-nav-dropdown" ref={ref}>
      <button
        type="button"
        className="sp-nav-link sp-nav-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
        <i className={`bi bi-chevron-down sp-nav-caret ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className={`sp-nav-dropdown-menu ${menuClassName}`} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  )
}
