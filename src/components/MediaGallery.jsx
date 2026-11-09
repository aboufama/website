import { useEffect, useRef, useState } from 'react'
import './MediaGallery.css'

const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* A video tile fetches nothing until its card is close to the viewport. Most tiles then play
   on hover; a tile marked `autoplay` plays by itself while it is on screen. */
function VideoTile({ item, alt, className, style }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  const [auto] = useState(() => Boolean(item.autoplay) && !prefersStill())

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const nearby = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); nearby.disconnect() }
    }, { rootMargin: '600px 0px' })
    nearby.observe(video)
    let onScreen
    if (auto) {
      onScreen = new IntersectionObserver(([entry]) => {
        if (entry.intersectionRatio >= 0.4) video.play().catch(() => {})
        else video.pause()
      }, { threshold: [0, 0.4] })
      onScreen.observe(video)
    }
    return () => { nearby.disconnect(); onScreen?.disconnect() }
  }, [auto])

  const hover = auto ? {} : {
    onMouseEnter: () => ref.current?.play().catch(() => {}),
    onMouseLeave: () => {
      const video = ref.current
      if (!video) return
      video.pause()
      video.currentTime = 0
    },
  }

  return (
    <div className={`${className} gallery-item--video`} style={style} {...hover}>
      <video
        ref={ref}
        src={item.src}
        poster={item.poster}
        muted
        loop
        playsInline
        preload={near ? 'auto' : 'none'}
        aria-label={item.label || alt}
        className="gallery-media"
      />
      {!auto && (
        <span className="gallery-play" aria-hidden="true">
          <svg viewBox="0 0 10 10" width="8" height="8"><path d="M2.2 1v8l6.6-4z" fill="currentColor" /></svg>
        </span>
      )}
    </div>
  )
}

function GalleryItem({ item, alt, tint }) {
  const isToggle = item.type === 'toggle'
  const className = [
    'gallery-item',
    isToggle                      ? 'gallery-item--toggle'      : '',
    !isToggle && item.transparent ? 'gallery-item--transparent' : '',
    item.zoom                     ? 'gallery-item--zoom'        : '',
  ].filter(Boolean).join(' ')
  const style = item.transparent && tint ? { background: tint } : undefined
  const label = item.alt || alt

  if (item.type === 'video') return <VideoTile item={item} alt={label} className={className} style={style} />

  return (
    <div className={className} style={style}>
      {isToggle ? (
        <>
          <img src={item.srcs[0]} alt={`${label}, first position`} loading="lazy" decoding="async" className="gallery-media gallery-toggle-a" />
          <img src={item.srcs[1]} alt={`${label}, second position`} loading="lazy" decoding="async" className="gallery-media gallery-toggle-b" />
        </>
      ) : (
        <img src={item.src} width={item.width} height={item.height} alt={label} loading="lazy" decoding="async" className="gallery-media" />
      )}
    </div>
  )
}

export default function MediaGallery({ items, projectTitle, tint, layout }) {
  return (
    <div className="media-gallery" data-layout={layout || undefined}>
      {items.map((item, i) => (
        <GalleryItem key={i} item={item} alt={`${projectTitle} ${i + 1}`} tint={tint} />
      ))}
    </div>
  )
}
