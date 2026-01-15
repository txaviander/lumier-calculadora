'use client'

import { useState } from 'react'
import LumierLogo from './LumierLogo'
import { signInWithGoogle, ALLOWED_DOMAIN } from '@/lib/auth'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error('Error en login:', err)
      setError('Error al iniciar sesión. Por favor, inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="bg-lumier-black rounded-2xl p-6 inline-block mb-6">
            <LumierLogo className="h-16" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Calculadora de Renovaciones
          </h1>
          <p className="text-gray-400">
            Plataforma interna para el equipo Lumier
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-gray-500 text-center text-sm mb-6">
            Accede con tu cuenta de correo corporativo
          </p>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Botón de Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
          </button>

          {/* Aviso de dominio */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Acceso restringido
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Solo se permite el acceso con cuentas de correo <strong>@{ALLOWED_DOMAIN}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          Lumier Casas Boutique © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
