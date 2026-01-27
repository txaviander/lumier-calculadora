'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return '?'
  }

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Panel Principal</h2>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-medium">
                {getInitials(user?.user_metadata?.full_name, user?.email)}
              </div>
            )}
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
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
            </>
          )}
        </div>
      </div>
    </header>
  )
}
