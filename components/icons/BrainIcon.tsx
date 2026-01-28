export function BrainIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Forma del cerebro - lado izquierdo */}
      <path d="M12 2.5c-1.5 0-2.5 1-3 2-1-.5-2.5-.5-3.5.5s-1 2.5-.5 3.5c-1 .5-2 1.5-2 3s1 2.5 2 3c-.5 1-.5 2.5.5 3.5s2.5 1 3.5.5c.5 1 1.5 2 3 2" />

      {/* Forma del cerebro - lado derecho */}
      <path d="M12 2.5c1.5 0 2.5 1 3 2 1-.5 2.5-.5 3.5.5s1 2.5.5 3.5c1 .5 2 1.5 2 3s-1 2.5-2 3c.5 1 .5 2.5-.5 3.5s-2.5 1-3.5.5c-.5 1-1.5 2-3 2" />

      {/* Línea central */}
      <line x1="12" y1="2.5" x2="12" y2="20.5" />

      {/* Nodos y conexiones - lado izquierdo */}
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
      <line x1="7" y1="7" x2="12" y2="7" />

      <circle cx="5.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <line x1="5.5" y1="12" x2="12" y2="12" />

      <circle cx="7" cy="17" r="1" fill="currentColor" stroke="none" />
      <line x1="7" y1="17" x2="12" y2="17" />

      {/* Nodos y conexiones - lado derecho */}
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
      <line x1="17" y1="7" x2="12" y2="7" />

      <circle cx="18.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <line x1="18.5" y1="12" x2="12" y2="12" />

      <circle cx="17" cy="17" r="1" fill="currentColor" stroke="none" />
      <line x1="17" y1="17" x2="12" y2="17" />
    </svg>
  )
}
