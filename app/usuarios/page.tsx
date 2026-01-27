'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/dashboard'
import { UserList } from '@/components/users'

export default function UsuariosPage() {
  return (
    <ProtectedRoute>
      <UsuariosContent />
    </ProtectedRoute>
  )
}

function UsuariosContent() {
  return (
    <DashboardLayout
      title="Gestión de Usuarios"
      subtitle="Administra los usuarios y sus permisos en la plataforma"
    >
      <UserList />
    </DashboardLayout>
  )
}
