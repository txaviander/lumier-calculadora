'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { DashboardLayout, AppsGrid } from '@/components/dashboard'

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Mis Aplicaciones"
        subtitle="Selecciona una herramienta para comenzar"
      >
        <AppsGrid />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
