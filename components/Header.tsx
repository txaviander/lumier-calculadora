'use client'

import Link from 'next/link'
import { useState } from 'react'
import LumierLogo from './LumierLogo'
import { useAuth } from './AuthProvider'

interface HeaderProps {
  projectName?: string
  showBackButton?: boolean
}

export default function Header({ projectName, showBackButton = false }: HeaderProps) {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  // Obtener iniciales del nombre
  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return '?'
  }

  return (
    <header className="bg-lumier-black text-white p-4 shadow-lg no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Proyectos</span>
            </Link>
          )}
          <Link href="/">
            <LumierLogo className="h-10" />
          </Link>
        </div>

        {projectName && (
          <div className="text-center flex-1 px-4 hidden md:block">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Proyecto</div>
            <div className="font-semibold">{projectName}</div>
          </div>
        )}

        {/* Usuario */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-lumier-gold flex items-center justify-center text-sm font-bold">
                {getInitials(user?.user_metadata?.full_name, user?.email)}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </div>
              <div className="text-xs text-gray-400">
                {user?.email}
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
              <div className="p-3 border-b bg-gray-50">
                <div className="font-medium text-gray-800">
                  {user?.user_metadata?.full_name || 'Usuario'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
