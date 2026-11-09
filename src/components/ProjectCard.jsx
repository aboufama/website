import MediaGallery from './MediaGallery'
import ProjectInfo from './ProjectInfo'
import Lineage from './Lineage'
import './ProjectCard.css'

export default function ProjectCard({ project }) {
  const { id, title, image, imageLarge, imageBleed, imageFlush, lineage, gallery, galleryTint, galleryLayout, flip } = project
  const { alt, ...imageProps } = image

  return (
    <article
      id={id}
      className={[
        'project-card',
        flip ? 'project-card--flip' : '',
        imageLarge ? 'project-card--image-large' : '',
        imageBleed ? 'project-card--image-bleed' : '',
        imageFlush ? 'project-card--image-flush' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="project-visual">
        <div className="project-images">
          <img {...imageProps} alt={alt || title} loading="lazy" decoding="async" className="project-image" />
        </div>
        {lineage && <Lineage items={lineage} />}
      </div>

      <ProjectInfo {...project} />

      <MediaGallery items={gallery} projectTitle={title} tint={galleryTint} layout={galleryLayout} />
    </article>
  )
}
