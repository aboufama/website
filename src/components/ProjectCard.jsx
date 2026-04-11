import Squircle from './Squircle'
import MediaGallery from './MediaGallery'
import './ProjectCard.css'

export default function ProjectCard({ project }) {
  const { title, subtitle, description, images, gallery, galleryTint, galleryLayout, imageLarge, imageRight, imageZoom, tags, links, flip } = project
  const hasGallery = gallery?.length > 0

  return (
    <article className={[
      'project-card',
      flip ? 'project-card--flip' : '',
      hasGallery ? 'project-card--with-gallery' : '',
      imageLarge ? 'project-card--image-large' : '',
      imageRight ? 'project-card--flanked' : '',
    ].filter(Boolean).join(' ')}>

      <div className={['project-images', imageLarge ? 'project-images--large' : ''].filter(Boolean).join(' ')}>
        {images.length > 0 ? (
          images.map((src, i) => (
            <img key={i} src={src} alt={`${title} ${i + 1}`} className="project-image" style={imageZoom ? { transform: `scale(${imageZoom})` } : undefined} />
          ))
        ) : (
          <Squircle className="project-image-placeholder" radius={32}>
            <span>{title[0]}</span>
          </Squircle>
        )}
      </div>

      <div className="project-info">
        <div className="project-title-row">
          <h2 className="project-title">{title}</h2>
          {subtitle && <span className="project-subtitle">{subtitle}</span>}
        </div>
        {description && description.split('\n\n').map((para, i) => (
          <p key={i} className="project-desc">{para}</p>
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

      {imageRight && (
        <img src={imageRight} alt={`${title} right`} className="project-image-right" />
      )}
      {!imageRight && hasGallery && (
        <MediaGallery items={gallery} projectTitle={title} tint={galleryTint} layout={galleryLayout} />
      )}
    </article>
  )
}
