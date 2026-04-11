import { useRef } from 'react'
import './MediaGallery.css'

function GalleryItem({ item, index, alt, tint }) {
  const videoRef = useRef(null)
  const isVideo  = item.type === 'video'
  const isToggle = item.type === 'toggle'

  const classes = [
    'gallery-item',
    isToggle                        ? 'gallery-item--toggle'      : '',
    isVideo                         ? 'gallery-item--video'       : '',
    !isToggle && item.transparent   ? 'gallery-item--transparent' : '',
    item.zoom                       ? 'gallery-item--zoom'        : '',
  ].filter(Boolean).join(' ')

  // Toggle items are always tinted via background (no padding class needed)
  const style = item.transparent && tint ? { background: tint } : undefined

  return (
    <div
      className={classes}
      style={style}
      onMouseEnter={() => videoRef.current?.play()}
      onMouseLeave={() => {
        if (!videoRef.current) return
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }}
    >
      {isVideo ? (
        <video ref={videoRef} src={item.src} muted loop playsInline preload="auto" className="gallery-media" />
      ) : isToggle ? (
        <>
          <img src={item.srcs[0]} alt={`${alt} A`} className="gallery-media gallery-toggle-a" />
          <img src={item.srcs[1]} alt={`${alt} B`} className="gallery-media gallery-toggle-b" />
        </>
      ) : (
        <img src={item.src} alt={alt} className="gallery-media" />
      )}
    </div>
  )
}

export default function MediaGallery({ items, projectTitle, tint, layout }) {
  return (
    <div className="media-gallery" data-layout={layout || undefined}>
      {items.map((item, i) => (
        <GalleryItem
          key={i}
          item={item}
          index={i}
          alt={`${projectTitle} ${i + 1}`}
          tint={tint}
        />
      ))}
    </div>
  )
}
