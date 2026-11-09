import { useEffect, useRef, useState } from 'react'
import Squircle from './Squircle'
import ProjectInfo from './ProjectInfo'
import MediaGallery from './MediaGallery'
import ScrollSequence from './ScrollSequence'
import './FilmProject.css'

const prefersStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const within = (ranges, t) => ranges.some(([from, to]) => t >= from && t < to)

/* Veridien: the usual row of cut-out, text and media. The cut-out is the simulator, which
   opens as the row scrolls in; the media column leads with the film, at tile size. */
export default function FilmProject({ project }) {
  const { id, title, film, sequence, gallery, galleryTint, flip } = project
  const frameRef = useRef(null)
  const videoRef = useRef(null)
  const panelRef = useRef(null)
  const barRef = useRef(null)
  const heldRef = useRef(false)           // the viewer pressed pause; do not resume on scroll
  const [near, setNear] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [soft, setSoft] = useState(true)  // close-ups of the organ are blurred until asked for
  const [frameWidth, setFrameWidth] = useState(0)

  // Fetch once the film is near the viewport; play while it is on screen.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    heldRef.current = prefersStill()
    const nearby = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); nearby.disconnect() }
    }, { rootMargin: '600px 0px' })
    const onScreen = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.5) {
        if (!heldRef.current) video.play().catch(() => {})
      } else {
        video.pause()
      }
    }, { threshold: [0, 0.5] })
    nearby.observe(video)
    onScreen.observe(video)
    return () => { nearby.disconnect(); onScreen.disconnect() }
  }, [])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const ro = new ResizeObserver(() => setFrameWidth(frame.offsetWidth))
    ro.observe(frame)
    return () => ro.disconnect()
  }, [])

  // Once per frame while playing: move the progress hairline, switch the blur on and off for
  // the close-ups, and keep the step panel readable by redrawing it, sharp, over the blur.
  // Written straight to the DOM so React does not re-render sixty times a second.
  useEffect(() => {
    const video = videoRef.current
    const frame = frameRef.current
    const canvas = panelRef.current
    const context = canvas?.getContext('2d')
    const update = () => {
      const t = video.currentTime
      if (barRef.current && video.duration) barRef.current.style.transform = `scaleX(${t / video.duration})`
      const started = t > 0 || !video.paused
      frame.dataset.closeup = started && within(film.closeups, t) ? '1' : '0'
      const panel = started && within(film.panel.times, t)
      frame.dataset.panel = panel ? '1' : '0'
      if (panel && soft && context && video.videoWidth) {
        const [x, y, w, h] = film.panel.rect
        const vw = video.videoWidth, vh = video.videoHeight
        if (canvas.width !== Math.round(w * vw)) { canvas.width = Math.round(w * vw); canvas.height = Math.round(h * vh) }
        context.drawImage(video, x * vw, y * vh, w * vw, h * vh, 0, 0, canvas.width, canvas.height)
      }
    }
    update()
    if (!playing) return
    let raf
    const tick = () => { update(); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, soft, film])

  const toggle = () => {
    const video = videoRef.current
    if (video.paused) {
      heldRef.current = false
      video.play().catch(() => {})
    } else {
      heldRef.current = true
      video.pause()
    }
  }

  const [px, py, pw, ph] = film.panel.rect

  return (
    <article id={id} className={`film-project${flip ? ' film-project--flip' : ''}`}>
      <div className="film-cutout">
        <ScrollSequence {...sequence} />
      </div>

      <ProjectInfo {...project} />

      <div className="film-media">
        <Squircle className="film-frame" radius={16} ref={frameRef} data-soft={soft ? '1' : '0'}>
          <video
            ref={videoRef}
            src={film.src}
            poster={film.poster}
            muted
            loop
            playsInline
            preload={near ? 'auto' : 'none'}
            aria-label={film.label}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <Squircle
            className="film-panel"
            radius={Math.max(3, Math.round(frameWidth * 0.0104))}
            style={{ left: `${px * 100}%`, top: `${py * 100}%`, width: `${pw * 100}%`, height: `${ph * 100}%` }}
            aria-hidden="true"
          >
            <canvas ref={panelRef} />
          </Squircle>
          <button type="button" className="film-note" onClick={() => setSoft(false)}>Show the organ</button>
          <div className="film-progress" aria-hidden="true"><span ref={barRef} /></div>
        </Squircle>
        <div className="film-controls">
          <label className="film-soften">
            <input type="checkbox" checked={soft} onChange={(e) => setSoft(e.target.checked)} />
            <span className="switch" aria-hidden="true" />
            Blur the organ <span className="film-soften-note">(it is a hydrogel model)</span>
          </label>
          <button type="button" className="film-toggle" onClick={toggle} aria-label={playing ? `Pause the ${title} film` : `Play the ${title} film`}>
            {playing ? (
              <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><path d="M2 1h2.2v8H2zM5.8 1H8v8H5.8z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><path d="M2.4 1v8L9 5z" fill="currentColor" /></svg>
            )}
          </button>
        </div>
        <MediaGallery items={gallery} projectTitle={title} tint={galleryTint} layout="pair" />
      </div>
    </article>
  )
}
