'use client'

import { useState } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:ml-[260px] flex flex-col min-h-screen">
        {/* Header */}
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Page Header */}
            {title && (
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-gray-500 mt-2">
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
