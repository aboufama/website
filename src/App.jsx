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
  const heroRef = useRef(null)

  useEffect(() => {
    const heroSrc = `${import.meta.env.BASE_URL}CutoutAndre.png`
    const projectSrcs = projects.flatMap((p) => p.images || [])
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
                  <a href="https://aboufama.github.io/Tilted_Display_Test/" target="_blank" rel="noopener noreferrer">Old Display</a>
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
    </div>
  )
}
