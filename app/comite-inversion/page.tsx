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
import type { ProjectListItem, ProjectStatus } from '@/lib/types'
import {
  ClipboardCheck,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Filter,
  TrendingUp,
  TrendingDown,
  FileCheck,
  Send,
  XCircle,
  CheckCircle2,
  Clock,
  Euro
} from 'lucide-react'

type SortOption = 'margin_desc' | 'margin_asc' | 'date_desc' | 'date_asc'
type TabOption = 'pendientes' | 'autorizadas' | 'presentadas' | 'historico'

// Extended project type with offer fields
interface ProjectWithOffer extends ProjectListItem {
  offer_amount?: number | null
  offer_date?: string | null
  offer_response_date?: string | null
  offer_rejection_reason?: string | null
  approval_date?: string | null
  rejection_date?: string | null
  rejection_reason?: string | null
}

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

  const [allProjects, setAllProjects] = useState<ProjectWithOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('margin_desc')
  const [activeTab, setActiveTab] = useState<TabOption>('pendientes')

  // Modal states
  const [selectedProject, setSelectedProject] = useState<ProjectWithOffer | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showOfferResultModal, setShowOfferResultModal] = useState(false)

  // Verificar permisos (solo direccion y admin pueden acceder)
  const canAccessCommittee = profile?.role === 'direccion' || profile?.role === 'admin'

  // Cargar todos los proyectos relevantes
  useEffect(() => {
    if (!canAccessCommittee) return

    const fetchProjects = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('projects_v2')
          .select(`
            *,
            commercial:commercial_user_id(
              id,
              full_name,
              avatar_url
            )
          `)
          .in('status', [
            'oportunidad',
            'oferta_autorizada',
            'oferta_presentada',
            'oferta_aceptada',
            'oferta_rechazada',
            'rechazado_ci'
          ])
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setAllProjects(data || [])
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Error al cargar las oportunidades')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [canAccessCommittee])

  // Filtrar proyectos por pestaña
  const getProjectsByTab = (tab: TabOption): ProjectWithOffer[] => {
    switch (tab) {
      case 'pendientes':
        return allProjects.filter(p => p.status === 'oportunidad')
      case 'autorizadas':
        return allProjects.filter(p => p.status === 'oferta_autorizada')
      case 'presentadas':
        return allProjects.filter(p => p.status === 'oferta_presentada')
      case 'historico':
        return allProjects.filter(p =>
          ['oferta_aceptada', 'oferta_rechazada', 'rechazado_ci'].includes(p.status)
        )
      default:
        return []
    }
  }

  const projects = getProjectsByTab(activeTab)

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

  // Contadores para las pestañas
  const counts = {
    pendientes: allProjects.filter(p => p.status === 'oportunidad').length,
    autorizadas: allProjects.filter(p => p.status === 'oferta_autorizada').length,
    presentadas: allProjects.filter(p => p.status === 'oferta_presentada').length,
    historico: allProjects.filter(p =>
      ['oferta_aceptada', 'oferta_rechazada', 'rechazado_ci'].includes(p.status)
    ).length
  }

  // Handlers
  const handleApprove = (project: ProjectWithOffer) => {
    setSelectedProject(project)
    setShowApprovalModal(true)
  }

  const handleReject = (project: ProjectWithOffer) => {
    setSelectedProject(project)
    setShowRejectionModal(true)
  }

  const handlePresentOffer = (project: ProjectWithOffer) => {
    setSelectedProject(project)
    setShowOfferModal(true)
  }

  const handleOfferResult = (project: ProjectWithOffer) => {
    setSelectedProject(project)
    setShowOfferResultModal(true)
  }

  const handleViewDetails = (project: ProjectWithOffer) => {
    router.push(`/calculadora?id=${project.project_id}`)
  }

  const handleConfirmApproval = async (notes?: string) => {
    if (!selectedProject || !profile) return

    const { error } = await supabase
      .from('projects_v2')
      .update({
        status: 'oferta_autorizada',
        approval_by_user_id: profile.id,
        approval_date: new Date().toISOString(),
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', selectedProject.project_id)

    if (error) throw error

    // Actualizar en la lista local
    setAllProjects(prev => prev.map(p =>
      p.project_id === selectedProject.project_id
        ? { ...p, status: 'oferta_autorizada' as ProjectStatus }
        : p
    ))
  }

  const handleConfirmRejection = async (reason: string) => {
    if (!selectedProject || !profile) return

    const { error } = await supabase
      .from('projects_v2')
      .update({
        status: 'rechazado_ci',
        rejection_date: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', selectedProject.project_id)

    if (error) throw error

    // Actualizar en la lista local
    setAllProjects(prev => prev.map(p =>
      p.project_id === selectedProject.project_id
        ? { ...p, status: 'rechazado_ci' as ProjectStatus, rejection_reason: reason }
        : p
    ))
  }

  const handleConfirmOfferPresented = async (offerAmount: number) => {
    if (!selectedProject) return

    const { error } = await supabase
      .from('projects_v2')
      .update({
        status: 'oferta_presentada',
        offer_amount: offerAmount,
        offer_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('project_id', selectedProject.project_id)

    if (error) throw error

    setAllProjects(prev => prev.map(p =>
      p.project_id === selectedProject.project_id
        ? { ...p, status: 'oferta_presentada' as ProjectStatus, offer_amount: offerAmount }
        : p
    ))
    setShowOfferModal(false)
    setSelectedProject(null)
  }

  const handleConfirmOfferResult = async (accepted: boolean, rejectionReason?: string) => {
    if (!selectedProject) return

    const updateData = accepted
      ? {
          status: 'oferta_aceptada' as const,
          offer_response_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      : {
          status: 'oferta_rechazada' as const,
          offer_response_date: new Date().toISOString(),
          offer_rejection_reason: rejectionReason || 'No especificado',
          updated_at: new Date().toISOString()
        }

    const { error } = await supabase
      .from('projects_v2')
      .update(updateData)
      .eq('project_id', selectedProject.project_id)

    if (error) throw error

    setAllProjects(prev => prev.map(p =>
      p.project_id === selectedProject.project_id
        ? { ...p, ...updateData }
        : p
    ))
    setShowOfferResultModal(false)
    setSelectedProject(null)
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

  const tabs: { id: TabOption; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'pendientes', label: 'Pendientes CI', icon: Clock, count: counts.pendientes },
    { id: 'autorizadas', label: 'Ofertas Autorizadas', icon: FileCheck, count: counts.autorizadas },
    { id: 'presentadas', label: 'Ofertas Presentadas', icon: Send, count: counts.presentadas },
    { id: 'historico', label: 'Histórico', icon: ClipboardCheck, count: counts.historico }
  ]

  return (
    <DashboardLayout
      title="Comité de Inversión"
      subtitle="Gestión del pipeline de oportunidades"
    >
      <div className="space-y-6">
        {/* Pestañas */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Estadísticas rápidas (solo en pendientes) */}
        {activeTab === 'pendientes' && counts.pendientes > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{counts.pendientes}</p>
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
        )}

        {/* Filtros */}
        {projects.length > 0 && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'pendientes' && 'Oportunidades Pendientes de CI'}
              {activeTab === 'autorizadas' && 'Ofertas Autorizadas - Pendientes de Presentar'}
              {activeTab === 'presentadas' && 'Ofertas Presentadas - Esperando Respuesta'}
              {activeTab === 'historico' && 'Histórico de Decisiones'}
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
        )}

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
            {activeTab === 'pendientes' && (
              <>
                <ClipboardCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Todo al día!</h3>
                <p className="text-gray-500">No hay oportunidades pendientes de revisión.</p>
              </>
            )}
            {activeTab === 'autorizadas' && (
              <>
                <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin ofertas autorizadas</h3>
                <p className="text-gray-500">Las ofertas autorizadas por el CI aparecerán aquí.</p>
              </>
            )}
            {activeTab === 'presentadas' && (
              <>
                <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin ofertas pendientes</h3>
                <p className="text-gray-500">Las ofertas presentadas a vendedores aparecerán aquí.</p>
              </>
            )}
            {activeTab === 'historico' && (
              <>
                <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin histórico</h3>
                <p className="text-gray-500">El histórico de decisiones aparecerá aquí.</p>
              </>
            )}
          </div>
        )}

        {/* Lista de proyectos */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedProjects.map(project => (
              <ProjectCard
                key={project.project_id}
                project={project}
                tab={activeTab}
                onApprove={() => handleApprove(project)}
                onReject={() => handleReject(project)}
                onPresentOffer={() => handlePresentOffer(project)}
                onOfferResult={() => handleOfferResult(project)}
                onViewDetails={() => handleViewDetails(project)}
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

          <OfferModal
            project={selectedProject}
            isOpen={showOfferModal}
            onClose={() => {
              setShowOfferModal(false)
              setSelectedProject(null)
            }}
            onConfirm={handleConfirmOfferPresented}
          />

          <OfferResultModal
            project={selectedProject}
            isOpen={showOfferResultModal}
            onClose={() => {
              setShowOfferResultModal(false)
              setSelectedProject(null)
            }}
            onConfirm={handleConfirmOfferResult}
          />
        </>
      )}
    </DashboardLayout>
  )
}

// Componente de tarjeta de proyecto adaptado según el tab
function ProjectCard({
  project,
  tab,
  onApprove,
  onReject,
  onPresentOffer,
  onOfferResult,
  onViewDetails
}: {
  project: ProjectWithOffer
  tab: TabOption
  onApprove: () => void
  onReject: () => void
  onPresentOffer: () => void
  onOfferResult: () => void
  onViewDetails: () => void
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const margin = project.net_margin_percentage || 0
  const marginColor = margin >= 18 ? 'text-green-600' : margin >= 14 ? 'text-amber-600' : 'text-red-600'
  const marginBg = margin >= 18 ? 'bg-green-100' : margin >= 14 ? 'bg-amber-100' : 'bg-red-100'

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    'oportunidad': { label: 'Pendiente CI', color: 'text-amber-700', bg: 'bg-amber-100' },
    'oferta_autorizada': { label: 'Oferta Autorizada', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    'oferta_presentada': { label: 'Esperando Vendedor', color: 'text-blue-700', bg: 'bg-blue-100' },
    'oferta_aceptada': { label: 'Oferta Aceptada', color: 'text-green-700', bg: 'bg-green-100' },
    'oferta_rechazada': { label: 'Oferta Rechazada', color: 'text-orange-700', bg: 'bg-orange-100' },
    'rechazado_ci': { label: 'Rechazado por CI', color: 'text-red-700', bg: 'bg-red-100' }
  }

  const status = statusConfig[project.status] || statusConfig['oportunidad']

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400">{project.project_code}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">{project.property_address}</h3>
          <p className="text-sm text-gray-500">{project.property_city}</p>
        </div>
        <div className={`px-3 py-2 rounded-lg ${marginBg}`}>
          <p className={`text-xl font-bold ${marginColor}`}>{margin.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Margen</p>
        </div>
      </div>

      {/* Datos principales */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500">Compra</p>
          <p className="font-semibold">{formatCurrency(project.purchase_price || 0)}</p>
        </div>
        <div>
          <p className="text-gray-500">Venta</p>
          <p className="font-semibold">{formatCurrency(project.estimated_sale_price || 0)}</p>
        </div>
        <div>
          <p className="text-gray-500">Superficie</p>
          <p className="font-semibold">{project.property_size_m2} m²</p>
        </div>
      </div>

      {/* Info adicional según estado */}
      {project.offer_amount && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Euro className="w-4 h-4" />
            <span className="text-sm font-medium">Oferta presentada: {formatCurrency(project.offer_amount)}</span>
          </div>
        </div>
      )}

      {project.status === 'oferta_rechazada' && project.offer_rejection_reason && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-700">
            <strong>Motivo rechazo:</strong> {project.offer_rejection_reason}
          </p>
        </div>
      )}

      {project.status === 'rechazado_ci' && project.rejection_reason && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Motivo rechazo CI:</strong> {project.rejection_reason}
          </p>
        </div>
      )}

      {/* Comercial */}
      {project.commercial && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
            {project.commercial.full_name?.charAt(0) || '?'}
          </div>
          <span>{project.commercial.full_name || 'Sin asignar'}</span>
        </div>
      )}

      {/* Acciones según pestaña */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={onViewDetails}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Ver Detalle
        </button>

        {tab === 'pendientes' && (
          <>
            <button
              onClick={onReject}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={onApprove}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Autorizar Oferta
            </button>
          </>
        )}

        {tab === 'autorizadas' && (
          <button
            onClick={onPresentOffer}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Registrar Oferta Presentada
          </button>
        )}

        {tab === 'presentadas' && (
          <button
            onClick={onOfferResult}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Registrar Resultado
          </button>
        )}
      </div>
    </div>
  )
}

// Modal para registrar oferta presentada
function OfferModal({
  project,
  isOpen,
  onClose,
  onConfirm
}: {
  project: ProjectWithOffer
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number) => Promise<void>
}) {
  const [amount, setAmount] = useState(project.purchase_price?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseInt(amount.replace(/\D/g, ''))
    if (!numAmount) {
      setError('Introduce un importe válido')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onConfirm(numAmount)
    } catch (err) {
      setError('Error al registrar la oferta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-[450px] max-w-[90vw]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Send className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Registrar Oferta Presentada</h3>
            <p className="text-sm text-gray-500">{project.property_address}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Importe de la oferta presentada
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej: 500000"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Precio de compra estimado: {new Intl.NumberFormat('es-ES').format(project.purchase_price || 0)} €
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Confirmar Oferta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para registrar resultado de oferta
function OfferResultModal({
  project,
  isOpen,
  onClose,
  onConfirm
}: {
  project: ProjectWithOffer
  isOpen: boolean
  onClose: () => void
  onConfirm: (accepted: boolean, reason?: string) => Promise<void>
}) {
  const [result, setResult] = useState<'accepted' | 'rejected' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!result) {
      setError('Selecciona el resultado de la oferta')
      return
    }
    if (result === 'rejected' && !rejectionReason.trim()) {
      setError('Indica el motivo del rechazo')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onConfirm(result === 'accepted', rejectionReason)
    } catch (err) {
      setError('Error al registrar el resultado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-[450px] max-w-[90vw]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Resultado de la Oferta</h3>
            <p className="text-sm text-gray-500">{project.property_address}</p>
          </div>
        </div>

        {project.offer_amount && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Oferta presentada:</strong> {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(project.offer_amount)}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <button
            type="button"
            onClick={() => setResult('accepted')}
            className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
              result === 'accepted'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CheckCircle2 className={`w-6 h-6 ${result === 'accepted' ? 'text-green-600' : 'text-gray-400'}`} />
            <div className="text-left">
              <p className="font-medium text-gray-900">Oferta Aceptada</p>
              <p className="text-sm text-gray-500">El vendedor aceptó. Se crea el proyecto.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setResult('rejected')}
            className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
              result === 'rejected'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <XCircle className={`w-6 h-6 ${result === 'rejected' ? 'text-orange-600' : 'text-gray-400'}`} />
            <div className="text-left">
              <p className="font-medium text-gray-900">Oferta Rechazada</p>
              <p className="text-sm text-gray-500">El vendedor no aceptó la oferta.</p>
            </div>
          </button>
        </div>

        {result === 'rejected' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del rechazo
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ej: Precio insuficiente, otra oferta mejor, vendedor se retractó..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !result}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Confirmar Resultado'}
          </button>
        </div>
      </div>
    </div>
  )
}
