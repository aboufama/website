import { useEffect, useRef, useState } from 'react'

// Descriptions carry two light marks: [text](https://...) is a link, and [[double brackets]]
// wrap the sentences about my own part.
const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g

function withLinks(text, at) {
  const out = []
  let last = 0
  for (const m of text.matchAll(LINK)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(<a key={`${at}-${m.index}`} href={m[2]} target="_blank" rel="noopener noreferrer">{m[1]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function withMarks(text) {
  return text.split(/\[\[(.+?)\]\]/s).map((piece, i) => (
    i % 2 ? <span key={i} className="mine">{withLinks(piece, i)}</span> : withLinks(piece, i)
  ))
}

export default function ProjectInfo({ title, titleLong, subtitle, org, description, tags, links }) {
  // On a phone the text is cut to one screen (see mobile.css); `clipped` says whether anything
  // is actually hidden, so "Read more" appears only when it has something to show.
  const bodyRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [clipped, setClipped] = useState(false)

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const measure = () => setClipped(body.scrollHeight > body.clientHeight + 2)
    measure()
    const watcher = new ResizeObserver(measure)
    watcher.observe(body)
    return () => watcher.disconnect()
  }, [open])

  return (
    <div className={`project-info${open ? ' project-info--open' : ''}`}>
      <div className="project-title-row">
        <h2 className={`project-title${titleLong ? ' project-title--long' : ''}`}>{title}</h2>
        {org ? (
          <a className="project-org" href={org.href} target="_blank" rel="noopener noreferrer">
            <img src={org.logo} alt={org.wordmark ? org.name : ''} width={org.width} height={org.height} />
            {!org.wordmark && org.name}
          </a>
        ) : subtitle && <span className="project-subtitle">{subtitle}</span>}
      </div>
      <div className="project-body" ref={bodyRef} data-clipped={clipped && !open ? '' : undefined}>
        {description && description.split('\n\n').map((para, i) => (
          <p key={i} className="project-desc">{withMarks(para)}</p>
        ))}
      </div>
      {(clipped || open) && (
        <button type="button" className="project-more" onClick={() => setOpen(!open)}>{open ? 'Show less' : 'Read more'}</button>
      )}
      {(tags?.length > 0 || links?.length > 0) && (
        <ul className="project-tags">
          {tags?.map((tag) => (
            <li key={tag} className="project-tag">{tag}</li>
          ))}
          {links?.map(({ label, href }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noopener noreferrer" className="project-tag project-tag--link">{label}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
