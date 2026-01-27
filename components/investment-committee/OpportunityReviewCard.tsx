'use client'

import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/users'
import {
  MapPin,
  Maximize2,
  Euro,
  TrendingUp,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight
} from 'lucide-react'
import type { ProjectListItem } from '@/lib/types'

interface OpportunityReviewCardProps {
  project: ProjectListItem
  onApprove: (project: ProjectListItem) => void
  onReject: (project: ProjectListItem) => void
  onViewDetails: (project: ProjectListItem) => void
}

export function OpportunityReviewCard({
  project,
  onApprove,
  onReject,
  onViewDetails
}: OpportunityReviewCardProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return '-'
    return value.toFixed(1) + '%'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getMarginConfig = (margin: number | null) => {
    if (margin === null) return { color: 'text-gray-400', bg: 'bg-gray-100', label: 'Sin datos' }
    if (margin >= 18) return { color: 'text-green-600', bg: 'bg-green-100', label: 'COMPRAR' }
    if (margin >= 14) return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'NEGOCIAR' }
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'RECHAZAR' }
  }

  const marginConfig = getMarginConfig(project.net_margin_percentage)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header con recomendación */}
      <div className={cn("px-5 py-3 flex items-center justify-between", marginConfig.bg)}>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold uppercase", marginConfig.color)}>
            {marginConfig.label}
          </span>
          <span className={cn("text-lg font-bold", marginConfig.color)}>
            {formatPercent(project.net_margin_percentage)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Creado {formatDate(project.created_at)}</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-5">
        {/* Título y ubicación */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <MapPin className="w-4 h-4" />
            <span>{project.property_city}</span>
            {project.property_size_m2 && (
              <>
                <span className="text-gray-300">•</span>
                <Maximize2 className="w-4 h-4" />
                <span>{project.property_size_m2} m²</span>
              </>
            )}
          </div>
          <h3 className="font-semibold text-lg text-gray-900">
            {project.property_address}
          </h3>
          {project.project_code && (
            <span className="text-xs text-gray-400 font-mono">
              {project.project_code}
            </span>
          )}
        </div>

        {/* Métricas financieras */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Compra</div>
            <div className="font-bold text-gray-900">{formatCurrency(project.purchase_price)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Venta Est.</div>
            <div className="font-bold text-gray-900">{formatCurrency(project.estimated_sale_price)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Margen</div>
            <div className={cn("font-bold", marginConfig.color)}>
              {formatPercent(project.net_margin_percentage)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ROI</div>
            <div className="font-bold text-gray-900">{formatPercent(project.roi_percentage)}</div>
          </div>
        </div>

        {/* Tipo de reforma */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Reforma:</span>
            <span className="font-medium text-gray-900 capitalize">{project.renovation_type}</span>
          </div>
        </div>

        {/* Comercial asignado */}
        {project.commercial && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
            <UserAvatar
              name={project.commercial.full_name}
              avatarUrl={project.commercial.avatar_url}
              size="sm"
            />
            <div>
              <div className="text-xs text-gray-500">Presentado por</div>
              <div className="font-medium text-gray-900">{project.commercial.full_name}</div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => onReject(project)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Rechazar
          </button>
          <button
            onClick={() => onApprove(project)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Aprobar
          </button>
          <button
            onClick={() => onViewDetails(project)}
            className="p-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            title="Ver detalles"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
