'use client'

import { cn } from '@/lib/utils'
import { UserAvatar } from './UserAvatar'
import { RoleBadge } from './RoleBadge'
import { Mail, Phone, MoreVertical, UserX, UserCheck, Pencil } from 'lucide-react'
import type { UserProfile } from '@/lib/types'

interface UserCardProps {
  user: UserProfile
  onEdit?: (user: UserProfile) => void
  onToggleActive?: (user: UserProfile) => void
  isCurrentUser?: boolean
  canEdit?: boolean
}

export function UserCard({
  user,
  onEdit,
  onToggleActive,
  isCurrentUser = false,
  canEdit = false
}: UserCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div
      className={cn(
        "bg-white rounded-xl border p-5 transition-all hover:shadow-md",
        user.is_active ? "border-gray-200" : "border-red-200 bg-red-50/30",
        isCurrentUser && "ring-2 ring-gray-900 ring-offset-2"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <UserAvatar
            name={user.full_name}
            avatarUrl={user.avatar_url}
            size="lg"
          />
          {!user.is_active && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <UserX className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {user.full_name || 'Sin nombre'}
            </h3>
            {isCurrentUser && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Tú
              </span>
            )}
          </div>

          <RoleBadge role={user.role} size="sm" className="mb-2" />

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Desde {formatDate(user.created_at)}
            </span>

            {canEdit && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit?.(user)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {!isCurrentUser && (
                  <button
                    onClick={() => onToggleActive?.(user)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      user.is_active
                        ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                    )}
                    title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    {user.is_active ? (
                      <UserX className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
