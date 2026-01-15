'use client'

import { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import LoginPage from './LoginPage'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Mostrar loading mientras verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lumier-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <LoginPage />
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>
}
