'use client'

import Link from 'next/link'

interface AppCardProps {
  title: string
  description: string
  icon: React.ReactNode
  color: string
  href: string
  disabled?: boolean
  external?: boolean
}

export function AppCard({ title, description, icon, color, href, disabled = false, external = false }: AppCardProps) {
  const cardContent = (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 ease-out h-full ${
      disabled
        ? 'opacity-50'
        : 'hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 cursor-pointer'
    }`}>
      <div className="flex flex-col h-full">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: color }}
        >
          <div className="text-white">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {disabled && (
              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Próximamente
              </span>
            )}
            {external && !disabled && (
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Arrow */}
        {!disabled && (
          <div className="flex justify-end mt-4">
            <svg
              className="w-5 h-5 text-gray-300 transition-all duration-300 group-hover:text-gray-900 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )

  if (disabled) {
    return (
      <div className="cursor-not-allowed">
        {cardContent}
      </div>
    )
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {cardContent}
      </a>
    )
  }

  return (
    <Link href={href} className="group block">
      {cardContent}
    </Link>
  )
}
