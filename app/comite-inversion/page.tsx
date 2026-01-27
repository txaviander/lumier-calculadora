'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/dashboard'
import { useUserProfile } from '@/hooks'
import { supabase } from '@/lib/supabase'
import {
  OpportunityReviewCard,
  ApprovalModal,
  RejectionModal
} from '@/components/investment-committee'
import type { ProjectListItem } from '@/lib/types'
import {
  ClipboardCheck,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'

type SortOption = 'margin_desc' | 'margin_asc' | 'date_desc' | 'date_asc'

export default function ComiteInversionPage() {
  return (
    <ProtectedRoute>
      <ComiteInversionContent />
    </ProtectedRoute>
  )
}

function ComiteInversionContent() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useUserProfile()

  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('margin_desc')

  // Modal states
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)

  // Verificar permisos (solo direccion y admin pueden acceder)
  const canAccessCommittee = profile?.role === 'direccion' || profile?.role === 'admin'

  // Cargar proyectos pendientes de revisión
  useEffect(() => {
    if (!canAccessCommittee) return

    const fetchPendingProjects = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select(`
            *,
            commercial:commercial_id(
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('status', 'evaluacion')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setProjects(data || [])
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Error al cargar las oportunidades pendientes')
      } finally {
        setLoading(false)
      }
    }

    fetchPendingProjects()
  }, [canAccessCommittee])

  // Ordenar proyectos
  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortBy) {
      case 'margin_desc':
        return (b.net_margin_percentage || 0) - (a.net_margin_percentage || 0)
      case 'margin_asc':
        return (a.net_margin_percentage || 0) - (b.net_margin_percentage || 0)
      case 'date_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'date_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      default:
        return 0
    }
  })

  // Handlers
  const handleApprove = (project: ProjectListItem) => {
    setSelectedProject(project)
    setShowApprovalModal(true)
  }

  const handleReject = (project: ProjectListItem) => {
    setSelectedProject(project)
    setShowRejectionModal(true)
  }

  const handleViewDetails = (project: ProjectListItem) => {
    // Navegar a la calculadora con el proyecto cargado
    router.push(`/calculadora?id=${project.project_id}`)
  }

  const handleConfirmApproval = async (notes?: string) => {
    if (!selectedProject || !profile) return

    const { error } = await supabase
      .from('projects')
      .update({
        status: 'aprobado',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
        approval_notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', selectedProject.project_id)

    if (error) throw error

    // Remover de la lista
    setProjects(prev => prev.filter(p => p.project_id !== selectedProject.project_id))
  }

  const handleConfirmRejection = async (reason: string) => {
    if (!selectedProject || !profile) return

    const { error } = await supabase
      .from('projects')
      .update({
        status: 'rechazado',
        rejected_by: profile.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', selectedProject.project_id)

    if (error) throw error

    // Remover de la lista
    setProjects(prev => prev.filter(p => p.project_id !== selectedProject.project_id))
  }

  // Loading state
  if (profileLoading) {
    return (
      <DashboardLayout
        title="Comité de Inversión"
        subtitle="Revisión y aprobación de oportunidades"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  // Sin permisos
  if (!canAccessCommittee) {
    return (
      <DashboardLayout
        title="Comité de Inversión"
        subtitle="Revisión y aprobación de oportunidades"
      >
        <div className="text-center py-20">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Solo los miembros del Comité de Inversión (Dirección y Administradores)
            pueden acceder a esta sección.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Comité de Inversión"
      subtitle="Revisión y aprobación de oportunidades"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-sm text-gray-500">Pendientes de revisión</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => (p.net_margin_percentage || 0) >= 18).length}
                </p>
                <p className="text-sm text-gray-500">Recomendadas (≥18%)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => (p.net_margin_percentage || 0) < 14).length}
                </p>
                <p className="text-sm text-gray-500">No recomendadas (&lt;14%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Oportunidades Pendientes
          </h2>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="margin_desc">Mayor margen primero</option>
              <option value="margin_asc">Menor margen primero</option>
              <option value="date_desc">Más recientes primero</option>
              <option value="date_asc">Más antiguos primero</option>
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <ClipboardCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Todo al día!
            </h3>
            <p className="text-gray-500">
              No hay oportunidades pendientes de revisión en este momento.
            </p>
          </div>
        )}

        {/* Lista de proyectos */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedProjects.map(project => (
              <OpportunityReviewCard
                key={project.project_id}
                project={project}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedProject && (
        <>
          <ApprovalModal
            project={selectedProject}
            isOpen={showApprovalModal}
            onClose={() => {
              setShowApprovalModal(false)
              setSelectedProject(null)
            }}
            onConfirm={handleConfirmApproval}
          />

          <RejectionModal
            project={selectedProject}
            isOpen={showRejectionModal}
            onClose={() => {
              setShowRejectionModal(false)
              setSelectedProject(null)
            }}
            onConfirm={handleConfirmRejection}
          />
        </>
      )}
    </DashboardLayout>
  )
}
