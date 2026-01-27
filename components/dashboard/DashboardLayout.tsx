'use client'

import { useState, useEffect } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Persistir preferencia de sidebar colapsado
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleSidebarCollapsed = () => {
    const newValue = !sidebarCollapsed
    setSidebarCollapsed(newValue)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newValue))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Header */}
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          onToggleCollapse={toggleSidebarCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          title={title}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Page Header */}
            {title && (
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-gray-500 mt-1 text-sm">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
