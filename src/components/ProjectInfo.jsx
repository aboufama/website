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

export default function ProjectInfo({ title, subtitle, org, description, tags, links }) {
  return (
    <div className="project-info">
      <div className="project-title-row">
        <h2 className="project-title">{title}</h2>
        {org ? (
          <a className="project-org" href={org.href} target="_blank" rel="noopener noreferrer" title={org.name}>
            <img src={org.logo} alt={org.name} width={org.width} height={org.height} />
          </a>
        ) : subtitle && <span className="project-subtitle">{subtitle}</span>}
      </div>
      {description && description.split('\n\n').map((para, i) => (
        <p key={i} className="project-desc">{withMarks(para)}</p>
      ))}
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
