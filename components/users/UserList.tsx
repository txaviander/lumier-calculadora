'use client'

import { useState, useMemo } from 'react'
import { useUsers, useUserMutations, useUserProfile, roleLabels, roleColors } from '@/hooks'
import { UserCard } from './UserCard'
import { UserEditModal } from './UserEditModal'
import { Search, Filter, Users, Loader2 } from 'lucide-react'
import type { UserProfile, UserRole } from '@/lib/types'

const allRoles: UserRole[] = [
  'comercial',
  'project_manager',
  'financiero',
  'diseno',
  'direccion',
  'legal',
  'marketing',
  'rrhh',
  'admin'
]

export function UserList() {
  const { profile: currentUser } = useUserProfile()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')
  const [showInactive, setShowInactive] = useState(false)

  const { users, loading, error, refetch } = useUsers({
    role: selectedRole || undefined,
    isActive: showInactive ? undefined : true,
    search: searchQuery || undefined
  })

  const { toggleUserActive } = useUserMutations()

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)

  // Determinar si el usuario actual puede editar
  const canEdit = currentUser?.role
    ? ['direccion', 'admin'].includes(currentUser.role)
    : false

  const canEditRole = currentUser?.role === 'admin'

  // Estadísticas por rol
  const roleStats = useMemo(() => {
    const stats: Record<string, number> = {}
    users.forEach(user => {
      stats[user.role] = (stats[user.role] || 0) + 1
    })
    return stats
  }, [users])

  const handleToggleActive = async (user: UserProfile) => {
    const action = user.is_active ? 'desactivar' : 'activar'
    if (!confirm(`¿Seguro que deseas ${action} a ${user.full_name || user.email}?`)) {
      return
    }

    try {
      await toggleUserActive(user.id, !user.is_active)
      refetch()
    } catch (err) {
      console.error('Error toggling user status:', err)
      alert(`Error al ${action} usuario`)
    }
  }

  const handleSaveUser = () => {
    refetch()
    setEditingUser(null)
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 mb-4">Error al cargar usuarios</div>
        <button
          onClick={() => refetch()}
          className="text-gray-600 hover:text-gray-900 underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Filtro por rol */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole | '')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">Todos los roles</option>
              {allRoles.map(role => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>

          {/* Mostrar inactivos */}
          {canEdit && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-600">Mostrar inactivos</span>
            </label>
          )}
        </div>

        {/* Contador */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>
              {users.length} usuario{users.length !== 1 ? 's' : ''}
              {selectedRole && ` con rol ${roleLabels[selectedRole]}`}
            </span>
          </div>

          {/* Pills de roles */}
          <div className="hidden md:flex items-center gap-2">
            {allRoles.map(role => {
              const count = roleStats[role] || 0
              if (count === 0) return null
              const colors = roleColors[role]
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(selectedRole === role ? '' : role)}
                  className={`px-2 py-1 text-xs rounded-full transition-all ${
                    selectedRole === role
                      ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-gray-400`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {roleLabels[role]}: {count}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      {users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No se encontraron usuarios
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? `No hay usuarios que coincidan con "${searchQuery}"`
              : 'No hay usuarios registrados'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              isCurrentUser={currentUser?.id === user.id}
              canEdit={canEdit}
              onEdit={setEditingUser}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          isOpen={true}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
          canEditRole={canEditRole}
        />
      )}
    </div>
  )
}
