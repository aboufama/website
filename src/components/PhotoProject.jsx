import Squircle from './Squircle'
import ProjectInfo from './ProjectInfo'
import './PhotoProject.css'

/* A project told by one wide photograph: the photo, large, with the text beside it. A small
   drawn arrow names the thing in the picture; hovering dims everything but that thing and
   brings up its headline figures. */
export default function PhotoProject({ project }) {
  const { id, title, photo } = project
  const { alt, credit, subject, specs, specsCaption, ...image } = photo

  return (
    <article id={id} className="photo-project">
      <figure className="photo-figure">
        <Squircle className="photo-frame" radius={30} tabIndex={specs ? 0 : undefined}>
          <img {...image} alt={alt} loading="lazy" decoding="async" />
          {subject && (
            <svg className="photo-dim" viewBox="0 0 1000 437.5" preserveAspectRatio="none" aria-hidden="true">
              <path fillRule="evenodd" d={`M0,0 H1000 V437.5 H0 Z ${subject}`} />
            </svg>
          )}
          <span className="photo-note" aria-hidden="true">
            <span className="photo-note-label">{title}</span>
            <svg viewBox="0 0 1000 437.5" preserveAspectRatio="none" fill="none">
              <defs>
                <linearGradient id="photo-note-fade" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0" />
                  <stop offset="40%" stopColor="#1d1d1f" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d="M 500,92 C 536,93 560,150 549,231" stroke="url(#photo-note-fade)" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <path d="M 543.5,219.5 L 549,231 L 556.5,220.5" stroke="#1d1d1f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
          {specs && (
            <div className="photo-specs">
              {specsCaption && <p>{specsCaption}</p>}
              <dl>
                {specs.map(({ value, label }) => (
                  <div key={value}>
                    <dt>{value}</dt>
                    <dd>{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </Squircle>
        {credit && <figcaption className="photo-credit">{credit}</figcaption>}
      </figure>
      <ProjectInfo {...project} />
    </article>
  )
}
