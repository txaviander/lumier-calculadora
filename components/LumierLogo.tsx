'use client'

export default function LumierLogo({ className = "h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 60" className={className} style={{ width: 'auto' }}>
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#d4af37' }} />
          <stop offset="50%" style={{ stopColor: '#f4e4bc' }} />
          <stop offset="100%" style={{ stopColor: '#d4af37' }} />
        </linearGradient>
      </defs>
      <text
        x="140"
        y="32"
        textAnchor="middle"
        fill="white"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '32px',
          fontWeight: 600,
          letterSpacing: '0.2em'
        }}
      >
        LUMIER
      </text>
      <line x1="40" y1="42" x2="120" y2="42" stroke="url(#goldGradient)" strokeWidth="1" />
      <line x1="160" y1="42" x2="240" y2="42" stroke="url(#goldGradient)" strokeWidth="1" />
      <text
        x="140"
        y="54"
        textAnchor="middle"
        fill="white"
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: '9px',
          fontWeight: 300,
          letterSpacing: '0.35em',
          opacity: 0.9
        }}
      >
        CASAS BOUTIQUE
      </text>
    </svg>
  )
}
