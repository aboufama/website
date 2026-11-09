import './Lineage.css'

/* The earlier designs of a project, oldest first, each named by its version and handing over
   to the next with a small drawn arrow; the last one hands over to the current design shown
   above the row, whose version sits at that arrow's head. */
export default function Lineage({ items, current }) {
  return (
    <div className="lineage">
      <ol className="lineage-row">
        {items.map((item, i) => (
          <li key={item.src} className="lineage-step">
            <span className="lineage-thumb">
              <img src={item.src} width={item.width} height={item.height} alt={item.alt} loading="lazy" decoding="async" />
              {i < items.length - 1 && (
                <svg className="lineage-hop" viewBox="0 0 30 14" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id={`lineage-hop-fade-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0" />
                      <stop offset="45%" stopColor="#1d1d1f" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path d="M 1,11 C 8,2.5 20,2.5 27,10" stroke={`url(#lineage-hop-fade-${i})`} strokeWidth="1" strokeLinecap="round" />
                  <path d="M 25.4,4.2 L 27,10 L 21.3,8" stroke="#1d1d1f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {i === items.length - 1 && (
                <span className="lineage-now">
                  {current && <span className="lineage-version lineage-now-version">{current}</span>}
                  <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="lineage-now-fade" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0" />
                      <stop offset="45%" stopColor="#1d1d1f" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path d="M 48,58 C 54,38 42,18 16,6" stroke="url(#lineage-now-fade)" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <path d="M 23,5.6 L 16,6 L 20.2,11.6" stroke="#1d1d1f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                </span>
              )}
            </span>
            <span className="lineage-label">
              {item.version && <span className="lineage-version">{item.version}</span>}
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
