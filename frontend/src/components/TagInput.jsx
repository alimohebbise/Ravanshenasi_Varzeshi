import { useState } from 'react'

export default function TagInput({ value, onChange, suggestions = [] }) {
  const [text, setText] = useState('')

  function addTag(raw) {
    const tag = raw.trim()
    if (!tag) return
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setText('')
      return
    }
    onChange([...value, tag])
    setText('')
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(text)
    } else if (e.key === 'Backspace' && !text && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const filteredSuggestions = text
    ? suggestions.filter((s) =>
        !value.some((t) => t.toLowerCase() === s.toLowerCase())
        && s.toLowerCase().includes(text.toLowerCase())
      )
    : []

  return (
    <div className="tag-input">
      <div className="tag-input-wrap">
        {value.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label="حذف برچسب">
              <i className="bi bi-x" />
            </button>
          </span>
        ))}
        <input
          className="tag-input-field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(text)}
          placeholder={value.length === 0 ? 'برچسب را بنویسید و Enter بزنید...' : ''}
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="tag-suggestions">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button type="button" key={s} onClick={() => addTag(s)}>
              <i className="bi bi-tag me-1" />{s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
