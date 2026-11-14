import { useState, useEffect, useRef } from 'react'
import ProjectCard from './components/ProjectCard'
import FilmProject from './components/FilmProject'
import PhotoProject from './components/PhotoProject'
import projects from './data/projects'
import { img, url } from './data/media'
import './App.css'
import './mobile.css'

const portrait = img('CutoutAndre.webp')

// Things I have built for the browser, each with a few seconds of it in use (recorded off the
// live site; the Clash of Clans battle is from the game's trailer). The still stands in under reduced motion.
const sites = [
  { label: 'Club Website', href: 'https://cornellphysicalintelligence.com/', shot: 'sites/club.webp', clip: 'sites/club.mp4' },
  { label: 'Clash of Clans', href: 'https://serfs.io/', shot: 'sites/serfs.webp', clip: 'sites/serfs.mp4' },
  { label: 'Royale Decomp', href: 'https://aboufama.github.io/clash-royale-research/', shot: 'sites/royale.webp', clip: 'sites/royale.mp4' },
  { label: 'Eye Art', href: 'https://aboufama.github.io/eyes/', shot: 'sites/eyes.webp', clip: 'sites/eyes.mp4', star: true },
  { label: 'Old Display', href: 'https://aboufama.github.io/tilted-display-test/', shot: 'sites/display.webp', clip: 'sites/display.mp4' },
]

const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [mine, setMine] = useState(false)   // "what I did": fade everything but my own part
  const heroRef = useRef(null)

  // Show the page as soon as the portrait and the typeface are in. Project media loads later,
  // as each project nears the viewport, and never holds the page back.
  useEffect(() => {
    let cancelled = false
    const reveal = () => {
      if (cancelled) return
      setLoaded(true)
      setShowWelcome(true)
    }
    const image = new Image()
    image.src = portrait.src
    const ready = [image.decode().catch(() => {})]
    if (document.fonts?.load) ready.push(document.fonts.load('600 48px "Inter Variable"').catch(() => {}))
    Promise.all(ready).then(reveal)
    const cap = setTimeout(reveal, 900)
    return () => { cancelled = true; clearTimeout(cap) }
  }, [])

  useEffect(() => {
    if (!showWelcome) return
    const timer = setTimeout(() => setShowWelcome(false), 1800)
    return () => clearTimeout(timer)
  }, [showWelcome])

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return
      const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.6))
      heroRef.current.style.opacity = fade
      // the clips rest while the first page is scrolled out of sight
      heroRef.current.querySelectorAll('video').forEach((clip) => {
        if (fade === 0) clip.pause()
        else if (clip.paused) clip.play().catch(() => {})
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className={`app${loaded ? ' app--loaded' : ''}${mine ? ' app--mine' : ''}`}>
      <label className="mine-toggle">
        <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
        <span className="switch" aria-hidden="true" />
        Highlight what I did
      </label>
      <div className="rotate-prompt" role="alert">
        <svg className="rotate-prompt__icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="14" y="6" width="36" height="52" rx="6" ry="6" stroke="#1d1d1f" strokeWidth="2.5" fill="none" />
          <line x1="26" y1="51" x2="38" y2="51" stroke="#1d1d1f" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="rotate-prompt__text">Please turn your screen sideways to view the portfolio</p>
      </div>
      <header className="hero-fixed" ref={heroRef}>
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
                {...portrait}
                alt="Andre Boufama"
                fetchpriority="high"
                decoding="async"
                className={`hero-cutout${loaded ? ' hero-cutout--animate' : ''}`}
              />
            </div>
            <div className="hero-text">
              <h1 className="hero-title">Hi! I'm Andre.</h1>
              <p className="hero-intro">
                I'm a Junior at Cornell and I love physical design. I started and lead{' '}
                <a href="https://cornellphysicalintelligence.com/" target="_blank" rel="noopener noreferrer">Cornell Physical Intelligence</a>{' '}
                and enjoy skiing, reading, and playing basketball when I'm not in the lab.
              </p>
              <p className="hero-tagline">Hover over the gallery images to enhance (or play video). These are my favorites, but there are quite a few more projects that I've had fun with :)</p>
              <div className="hero-links-box">
                <span className="hero-links-title">Software Projects</span>
                <div className="hero-sites">
                  {sites.map(({ label, href, shot, clip, star }) => (
                    <a key={label} className="hero-site" href={href} target="_blank" rel="noopener noreferrer">
                      <span className="hero-site-shot">
                        {still
                          ? <img src={url(shot)} width="400" height="250" alt="" decoding="async" />
                          : <video src={url(clip)} poster={url(shot)} width="400" height="250" autoPlay muted loop playsInline aria-hidden="true" />}
                      </span>
                      <span className="hero-site-label">{label}{star && <span className="hero-star"> &#9733;</span>}</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="hero-links-box">
                <span className="hero-links-title">Socials</span>
                <div className="hero-links">
                  <a href="https://www.linkedin.com/in/andre-boufama-7b2aa8240/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  <a href="https://github.com/aboufama" target="_blank" rel="noopener noreferrer">GitHub</a>
                  <a href={url('AndreResumeApril.pdf')} target="_blank" rel="noopener noreferrer">Resume</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <svg className="hero-cue" viewBox="0 0 16 9" width="16" height="9" fill="none" aria-hidden="true">
          <path d="M1.5 1.5 8 7.5l6.5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </header>
      <div className="hero-spacer"></div>
      <main className="projects">
        {projects.map((project) => (
          project.layout === 'note' ? <p key={project.id} className="projects-note">{project.text}</p>
            : project.layout === 'film' ? <FilmProject key={project.id} project={project} />
            : project.layout === 'photo' ? <PhotoProject key={project.id} project={project} />
              : <ProjectCard key={project.id} project={project} />
        ))}
      </main>
    </div>
  )
}
