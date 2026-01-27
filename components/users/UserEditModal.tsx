'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { useUserMutations, roleLabels } from '@/hooks'
import type { UserProfile, UserRole } from '@/lib/types'

interface UserEditModalProps {
  user: UserProfile
  isOpen: boolean
  onClose: () => void
  onSave: (updatedUser: UserProfile) => void
  canEditRole?: boolean
}

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

export function UserEditModal({
  user,
  isOpen,
  onClose,
  onSave,
  canEditRole = false
}: UserEditModalProps) {
  const { updateUser, loading, error } = useUserMutations()

  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    role: user.role
  })

  useEffect(() => {
    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role
    })
  }, [user])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const updates: Record<string, unknown> = {
        full_name: formData.full_name,
        phone: formData.phone || null
      }

      if (canEditRole) {
        updates.role = formData.role
      }

      const updatedUser = await updateUser(user.id, updates as Parameters<typeof updateUser>[1])
      onSave(updatedUser)
      onClose()
    } catch (err) {
      console.error('Error updating user:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar Usuario</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Avatar y email (no editables) */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <UserAvatar
              name={formData.full_name}
              avatarUrl={user.avatar_url}
              size="xl"
            />
            <div>
              <div className="font-medium text-gray-900">
                {formData.full_name || 'Sin nombre'}
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error.message}
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Ej: Juan García López"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Ej: +34 612 345 678"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Rol (solo si tiene permiso) */}
            {canEditRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  {allRoles.map(role => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
