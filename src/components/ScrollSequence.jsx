import { useEffect, useRef } from 'react'
import './ScrollSequence.css'

const wantsStill = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(navigator.connection?.saveData)

/* First, last, then coarse to fine, so any scroll position soon has a decoded frame near it. */
function loadOrder(count) {
  const order = [0, count - 1]
  const seen = new Set(order)
  for (let step = 16; step >= 1; step = Math.floor(step / 2)) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) { seen.add(i); order.push(i) }
    }
  }
  return order
}

/* A pre-rendered frame sequence scrubbed by the scroll position: it starts as the picture
   enters the bottom of the window and has finished by the time it reaches the middle. The
   first frame is a plain <img>, so the picture is complete without JavaScript, with reduced
   motion and on data saver; the other frames load only once it is near the viewport. */
export default function ScrollSequence({ frame, count, width, height, alt }) {
  const boxRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: false })
    if (!box || !context || wantsStill()) return

    const frames = new Array(count).fill(null)
    let shown = -1
    let queued = false
    let stopped = false

    const wanted = () => {
      const rect = box.getBoundingClientRect()
      const start = window.innerHeight * 0.94          // top of the picture entering the window
      const end = window.innerHeight * 0.5 - rect.height * 0.55   // picture just above centre
      const progress = (start - rect.top) / Math.max(start - end, 1)
      return Math.round(Math.min(1, Math.max(0, progress)) * (count - 1))
    }
    const nearest = (index) => {
      for (let d = 0; d < count; d++) {
        if (frames[index - d]) return index - d
        if (frames[index + d]) return index + d
      }
      return -1
    }
    const draw = () => {
      queued = false
      const index = nearest(wanted())
      if (index < 0 || index === shown) return
      context.drawImage(frames[index], 0, 0, canvas.width, canvas.height)
      if (shown < 0) canvas.dataset.ready = ''
      shown = index
    }
    const request = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(draw)
    }

    const queue = loadOrder(count)
    const loader = async () => {
      for (let next = queue.shift(); next !== undefined && !stopped; next = queue.shift()) {
        const image = new Image()
        image.src = frame(next)
        try { await image.decode() } catch { continue }
        frames[next] = image
        request()
      }
    }
    const nearby = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      nearby.disconnect()
      for (let i = 0; i < 4; i++) loader()
    }, { rootMargin: '70% 0px' })
    nearby.observe(box)

    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => {
      stopped = true
      nearby.disconnect()
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
    }
  }, [frame, count])

  return (
    <div className="scroll-sequence" ref={boxRef} style={{ aspectRatio: `${width} / ${height}` }}>
      <img src={frame(0)} width={width} height={height} alt={alt} loading="lazy" decoding="async" />
      <canvas ref={canvasRef} width={width} height={height} aria-hidden="true" />
    </div>
  )
}
