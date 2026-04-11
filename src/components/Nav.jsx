import './Nav.css'

const links = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/andreboufama' },
  { label: 'GitHub', href: 'https://github.com/aboufama' },
  { label: 'Resume', href: '/resume.pdf' },
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
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
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
