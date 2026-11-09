// [[double brackets]] in a description mark the sentences about my own part.
function withMarks(text) {
  return text.split(/\[\[(.+?)\]\]/s).map((piece, i) => (
    i % 2 ? <span key={i} className="mine">{piece}</span> : piece
  ))
}

export default function ProjectInfo({ title, subtitle, description, tags, links }) {
  return (
    <div className="project-info">
      <div className="project-title-row">
        <h2 className="project-title">{title}</h2>
        {subtitle && <span className="project-subtitle">{subtitle}</span>}
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
