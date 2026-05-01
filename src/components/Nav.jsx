import './Nav.css'

const links = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/andre-boufama-7b2aa8240/' },
  { label: 'GitHub', href: 'https://github.com/aboufama' },
  { label: 'Resume', href: `${import.meta.env.BASE_URL}AndreResumeApril.pdf` },
]

export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <span className="nav-name">Andre Boufama</span>
        <nav className="nav-links">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
