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

/* Every arrow on the page is drawn the way the hexapod's are: a thin curved stroke that fades
   in from its tail, with an open head. `d` is the stroke, `head` its two barbs; all of these
   point down the page, so the fade runs top to bottom. */
function DrawnArrow({ id, className, viewBox, d, head }) {
  return (
    <svg className={className} viewBox={viewBox} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="45%" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={d} stroke={`url(#${id})`} strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={head} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

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
                I'm a junior at Cornell and I love physical design. I started and lead{' '}
                <a href="https://cornellphysicalintelligence.com/" target="_blank" rel="noopener noreferrer">Cornell Physical Intelligence</a>{' '}
                and enjoy skiing, reading, and playing basketball when I'm not in the lab.
              </p>
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
        <DrawnArrow
          id="hero-cue-fade"
          className="hero-cue"
          viewBox="0 0 20 34"
          d="M 9,2 C 13,10 10,20 10,31"
          head="M 6.6,25.6 L 10,31 L 13.4,24.9"
        />
      </header>
      <div className="hero-spacer"></div>
      <main className="projects">
        {projects.map((project) => (
          project.layout === 'note' ? (
            <p key={project.id} className="projects-note">
              <DrawnArrow
                id="note-fade-left"
                className="note-arrow"
                viewBox="0 0 30 60"
                d="M 24,3 C 8,12 3,34 13,55"
                head="M 13.3,48 L 13,55 L 7.4,50.8"
              />
              <span>{project.text}</span>
              <DrawnArrow
                id="note-fade-right"
                className="note-arrow"
                viewBox="0 0 30 60"
                d="M 6,5 C 21,13 27,33 18,55"
                head="M 23.4,50.5 L 18,55 L 17.3,48"
              />
            </p>
          )
            : project.layout === 'film' ? <FilmProject key={project.id} project={project} />
            : project.layout === 'photo' ? <PhotoProject key={project.id} project={project} />
              : <ProjectCard key={project.id} project={project} />
        ))}
      </main>
    </div>
  )
}
