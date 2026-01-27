'use client'

import { useState, useEffect, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/dashboard'
import { useUserProfile, useUserMutations } from '@/hooks'
import { UserAvatar, RoleBadge } from '@/components/users'
import { supabase } from '@/lib/supabase'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  Upload
} from 'lucide-react'

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <PerfilContent />
    </ProtectedRoute>
  )
}

function PerfilContent() {
  const { profile, loading: profileLoading, refetch } = useUserProfile()
  const { updateCurrentUserProfile, loading: saving } = useUserMutations()

  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar formData cuando se carga el perfil
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])

  const handleStartEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      })
    }
    setIsEditing(true)
    setSaveStatus('idle')
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      })
    }
    setIsEditing(false)
    setSaveStatus('idle')
  }

  const handleSave = async () => {
    try {
      await updateCurrentUserProfile({
        full_name: formData.full_name || undefined,
        phone: formData.phone || undefined
      })
      setSaveStatus('success')
      setIsEditing(false)
      refetch()

      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveStatus('error')
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setAvatarError('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('La imagen debe ser menor a 2MB')
      return
    }

    setUploadingAvatar(true)
    setAvatarError(null)

    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        // Si el bucket no existe, intentar crear uno público
        if (uploadError.message.includes('not found')) {
          setAvatarError('El almacenamiento no está configurado. Contacta al administrador.')
          return
        }
        throw uploadError
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Actualizar perfil con nueva URL
      await updateCurrentUserProfile({
        avatar_url: publicUrl
      })

      await refetch()
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setAvatarError('Error al subir la imagen. Inténtalo de nuevo.')
    } finally {
      setUploadingAvatar(false)
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (profileLoading) {
    return (
      <DashboardLayout
        title="Mi Perfil"
        subtitle="Gestiona tu información personal"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout
        title="Mi Perfil"
        subtitle="Gestiona tu información personal"
      >
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Error al cargar perfil
          </h3>
          <p className="text-gray-500">
            No se pudo cargar tu información de perfil
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Mi Perfil"
      subtitle="Gestiona tu información personal"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Status message */}
        {saveStatus === 'success' && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>Perfil actualizado correctamente</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>Error al guardar los cambios</span>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 h-24" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              {/* Avatar con opción de cambiar */}
              <div className="relative group">
                <UserAvatar
                  name={profile.full_name}
                  avatarUrl={profile.avatar_url}
                  size="xl"
                  className="ring-4 ring-white w-24 h-24 text-2xl"
                />
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  title="Cambiar foto"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex-1 pt-2 sm:pt-0 sm:pb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || 'Sin nombre'}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <RoleBadge role={profile.role} />
                  {!profile.is_active && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Cuenta inactiva
                    </span>
                  )}
                </div>
                {avatarError && (
                  <p className="text-sm text-red-500 mt-2">{avatarError}</p>
                )}
              </div>
              <div>
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Editar perfil
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
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
                )}
              </div>
            </div>

            {/* Hint para cambiar avatar */}
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
              <Upload className="w-3 h-3" />
              Pasa el cursor sobre la foto para cambiarla (máx. 2MB)
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Información Personal
          </h3>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nombre completo
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.full_name || 'No especificado'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-gray-900">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                El email no se puede modificar
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+34 612 345 678"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.phone || 'No especificado'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Información de la Cuenta
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Rol en la plataforma
              </label>
              <RoleBadge role={profile.role} />
              <p className="text-xs text-gray-400 mt-2">
                Contacta con un administrador para cambiar tu rol
              </p>
            </div>

            {/* Fecha de registro */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Miembro desde
              </label>
              <p className="text-gray-900">{formatDate(profile.created_at)}</p>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Estado de la cuenta
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                profile.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {profile.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            {/* Última actualización */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Última actualización
              </label>
              <p className="text-gray-900">{formatDate(profile.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Permisos Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Permisos de tu rol
          </h3>

          <div className="space-y-2">
            {getRolePermissions(profile.role).map((permission, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">{permission}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Función auxiliar para obtener permisos por rol
function getRolePermissions(role: string): string[] {
  const basePermissions = [
    'Ver dashboard principal',
    'Ver proyectos asignados'
  ]

  const rolePermissions: Record<string, string[]> = {
    comercial: [
      ...basePermissions,
      'Crear nuevas oportunidades',
      'Editar proyectos propios',
      'Usar calculadora de rentabilidad'
    ],
    project_manager: [
      ...basePermissions,
      'Gestionar proyectos asignados',
      'Crear y editar presupuestos',
      'Asignar tareas'
    ],
    financiero: [
      ...basePermissions,
      'Ver métricas financieras completas',
      'Aprobar/rechazar proyectos',
      'Generar informes financieros'
    ],
    diseno: [
      ...basePermissions,
      'Ver proyectos en fase de diseño',
      'Subir documentos de diseño'
    ],
    direccion: [
      ...basePermissions,
      'Ver todos los proyectos',
      'Aprobar/rechazar proyectos',
      'Gestionar usuarios',
      'Ver estadísticas globales'
    ],
    legal: [
      ...basePermissions,
      'Ver documentación legal',
      'Gestionar contratos'
    ],
    marketing: [
      ...basePermissions,
      'Ver proyectos en venta',
      'Gestionar campañas'
    ],
    rrhh: [
      ...basePermissions,
      'Ver información de empleados',
      'Gestionar perfiles básicos'
    ],
    admin: [
      'Acceso completo a todas las funciones',
      'Gestionar usuarios y roles',
      'Configurar sistema',
      'Ver logs de auditoría'
    ]
  }

  return rolePermissions[role] || basePermissions
}
