import { useState, useEffect, useRef } from 'react'
import ProjectCard from './components/ProjectCard'
import projects from './data/projects'
import './App.css'

function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = resolve
          img.src = url
        })
    )
  )
}

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [arrowVisible, setArrowVisible] = useState(false)
  const heroRef = useRef(null)
  const releasedRef = useRef(false)
  const lockedRef = useRef(false)
  const lockYRef = useRef(0)

  useEffect(() => {
    const heroSrc = `${import.meta.env.BASE_URL}CutoutAndre.png`
    const projectSrcs = projects.flatMap((p) => [
      ...(p.images || []),
      p.highlightSecondImage,
      ...(p.highlightMechanism || []),
    ].filter(Boolean))
    preloadImages([heroSrc, ...projectSrcs]).then(() => {
      setLoaded(true)
      setShowWelcome(true)
      const timer = setTimeout(() => setShowWelcome(false), 1800)
      return () => clearTimeout(timer)
    })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return
      const scrollY = window.scrollY
      const fade = Math.max(0, 1 - scrollY / (window.innerHeight * 0.6))
      heroRef.current.style.opacity = fade
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const stack = document.querySelector('.highlight-image-stack')
    const base = document.querySelector('.highlight-image-base')
    const slot = document.querySelector('.mechanism-slot')
    if (!stack || !base) return

    const playFlap = (cls) => {
      stack.classList.remove('flap-active', 'flap-active-twice')
      void stack.offsetWidth
      stack.classList.add(cls)
    }

    let revealTimer = null
    let playMechTimer = null

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          playFlap('flap-active-twice')
          if (slot) {
            revealTimer = setTimeout(() => {
              slot.classList.add('mech-visible')
              playMechTimer = setTimeout(() => {
                slot.dispatchEvent(new CustomEvent('play-mechanism'))
              }, 400)
            }, 1700)
          }
          observer.disconnect()
        }
      },
      { threshold: [0.3] }
    )
    observer.observe(base)
    const handleClick = () => playFlap('flap-active')
    stack.addEventListener('click', handleClick)

    return () => {
      if (revealTimer) clearTimeout(revealTimer)
      if (playMechTimer) clearTimeout(playMechTimer)
      observer.disconnect()
      stack.removeEventListener('click', handleClick)
    }
  }, [])

  useEffect(() => {
    const slot = document.querySelector('.mechanism-slot')
    if (!slot) return
    const frames = slot.querySelectorAll('.mechanism-frame')
    if (frames.length === 0) return

    const sequence = [0, 1, 2, 3, 4, 3, 2, 1]
    const frameMs = 100
    let timeoutIds = []

    const playSequence = () => {
      timeoutIds.forEach(clearTimeout)
      timeoutIds = []
      sequence.forEach((idx, i) => {
        const id = setTimeout(() => {
          frames.forEach((f) => f.classList.remove('active'))
          frames[idx].classList.add('active')
        }, i * frameMs)
        timeoutIds.push(id)
      })
    }

    slot.addEventListener('click', playSequence)
    slot.addEventListener('play-mechanism', playSequence)

    return () => {
      slot.removeEventListener('click', playSequence)
      slot.removeEventListener('play-mechanism', playSequence)
      timeoutIds.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    let lastScrollY = window.scrollY

    const engageLock = (lockY) => {
      lockedRef.current = true
      lockYRef.current = lockY
      const prevBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo({ top: lockY })
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.scrollBehavior = prevBehavior
      lastScrollY = lockY
      setArrowVisible(true)
    }

    const releasePermanently = () => {
      if (releasedRef.current) return
      releasedRef.current = true
      if (lockedRef.current) {
        document.documentElement.style.overflow = ''
        lockedRef.current = false
      }
      setArrowVisible(false)
    }

    const handleScroll = () => {
      if (releasedRef.current || lockedRef.current) {
        lastScrollY = window.scrollY
        return
      }
      const img = document.querySelector('.highlight-image-base')
      if (!img) {
        lastScrollY = window.scrollY
        return
      }
      const rect = img.getBoundingClientRect()
      const dy = window.scrollY - lastScrollY
      lastScrollY = window.scrollY
      if (dy > 0 && rect.bottom <= window.innerHeight && rect.bottom + dy >= window.innerHeight) {
        engageLock(window.scrollY + rect.bottom - window.innerHeight)
      }
    }

    const handleWheel = (e) => {
      if (releasedRef.current) return
      if (lockedRef.current) {
        if (e.deltaY < 0) releasePermanently()
        return
      }
      const img = document.querySelector('.highlight-image-base')
      if (!img) return
      const rect = img.getBoundingClientRect()
      const distToLock = rect.bottom - window.innerHeight
      if (e.deltaY > 0 && distToLock > 0 && e.deltaY >= distToLock) {
        e.preventDefault()
        engageLock(window.scrollY + distToLock)
      }
    }

    const handleKeyDown = (e) => {
      if (releasedRef.current || !lockedRef.current) return
      if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) {
        releasePermanently()
      } else if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key)) {
        e.preventDefault()
      }
    }

    let touchStartY = null
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }
    const handleTouchMove = (e) => {
      if (releasedRef.current || !lockedRef.current || touchStartY === null) return
      const dy = touchStartY - e.touches[0].clientY
      if (dy < -20) {
        releasePermanently()
      } else {
        e.preventDefault()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      if (lockedRef.current) {
        document.documentElement.style.overflow = ''
      }
    }
  }, [])

  const handleRelease = () => {
    if (lockedRef.current) {
      document.documentElement.style.overflow = ''
      lockedRef.current = false
    }
    releasedRef.current = true
    setArrowVisible(false)
    const cards = document.querySelectorAll('.project-card')
    if (cards.length > 1) {
      cards[1].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className={`app${loaded ? ' app--loaded' : ''}`}>
      <div className="rotate-prompt" role="alert">
        <svg className="rotate-prompt__icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="14" y="6" width="36" height="52" rx="6" ry="6" stroke="#1d1d1f" strokeWidth="2.5" fill="none" />
          <line x1="26" y1="51" x2="38" y2="51" stroke="#1d1d1f" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="rotate-prompt__text">Please turn your screen sideways to view the portfolio</p>
      </div>
      <div className="hero-fixed" ref={heroRef}>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-cutout-wrapper">
              {showWelcome && (
                <div className="speech-bubble">
                  <span className="speech-text">welcome!</span>
                  <svg className="speech-line" viewBox="0 0 80 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="line-fade" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0" />
                        <stop offset="40%" stopColor="#1d1d1f" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,1.5 C 65,1.5 75,1.5 80,15" stroke="url(#line-fade)" strokeWidth="1" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              )}
              <img
                src={`${import.meta.env.BASE_URL}CutoutAndre.png`}
                alt="Andre Boufama"
                className={`hero-cutout${loaded ? ' hero-cutout--animate' : ''}`}
              />
            </div>
            <div className="hero-text">
              <h1 className="hero-title">Andre's Projects</h1>
              <p className="hero-tagline">Hover over the gallery images to enhance (or play video). These are my favorites, but there are quite a few more projects that I've had fun with :)</p>
              <div className="hero-links-box">
                <span className="hero-links-title">Software Projects</span>
                <div className="hero-links">
                  <a href="https://tm.cornellphysicalintelligence.com/" target="_blank" rel="noopener noreferrer">Team Manager</a>
                  <a href="https://cornellphysicalintelligence.com/" target="_blank" rel="noopener noreferrer">Club Website</a>
                  <a href="https://serfs.io/" target="_blank" rel="noopener noreferrer">Clash of Clans</a>
                  <a href="https://aboufama.github.io/eyes/" target="_blank" rel="noopener noreferrer">Eye Art <span style={{ color: '#f5c518', textDecoration: 'none', display: 'inline-block' }}>&#9733;</span></a>
                  <a href="https://aboufama.github.io/tilted-display-test/" target="_blank" rel="noopener noreferrer">Old Display</a>
                </div>
              </div>
              <div className="hero-links-box">
                <span className="hero-links-title">Socials</span>
                <div className="hero-links">
                  <a href="https://www.linkedin.com/in/andre-boufama-7b2aa8240/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  <a href="https://github.com/aboufama" target="_blank" rel="noopener noreferrer">GitHub</a>
                  <a href={`${import.meta.env.BASE_URL}AndreResumeApril.pdf`} target="_blank" rel="noopener noreferrer">Resume</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="hero-spacer"></div>
      <section className="projects">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
      {arrowVisible && (
        <button
          className="scroll-unlock"
          onClick={handleRelease}
          aria-label="Continue scrolling"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}
