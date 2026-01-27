'use client'

import { cn } from '@/lib/utils'
import { roleLabels, roleColors } from '@/hooks'
import type { UserRole } from '@/lib/types'

interface RoleBadgeProps {
  role: UserRole
  size?: 'sm' | 'md'
  className?: string
}

export function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
  const colors = roleColors[role] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  const label = roleLabels[role] || role

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      {label}
    </span>
  )
}
