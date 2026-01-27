"use client"

import { Button } from "@/components/ui/button"
import { Save, Share2, Printer, History, SendHorizonal, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"

// Estados posibles del proyecto en el pipeline
export type CIStatus =
  | 'not_submitted'      // No presentado al CI
  | 'oportunidad'        // Presentado, pendiente de CI
  | 'rechazado_ci'       // CI rechazó la oportunidad
  | 'oferta_autorizada'  // CI aprobó, pendiente de presentar oferta
  | 'oferta_presentada'  // Oferta enviada al vendedor
  | 'oferta_rechazada'   // Vendedor rechazó la oferta
  | 'oferta_aceptada'    // Vendedor aceptó → Proyecto
  | 'en_ejecucion'       // En obras
  | 'en_venta'           // En comercialización
  | 'vendido'            // Cerrado

interface ProjectHeaderProps {
  title: string
  versionNumber?: number
  onSave: () => void
  onShare: () => void
  onPrint: () => void
  onVersionHistory?: () => void
  onSubmitToCI?: () => void
  hasChanges?: boolean
  saving?: boolean
  submittingToCI?: boolean
  // Estado del CI
  ciStatus?: CIStatus
  ciProjectCode?: string | null
  ciRejectionReason?: string | null
  offerRejectionReason?: string | null
}

// Configuración visual para cada estado
const statusConfig: Record<CIStatus, {
  label: string
  icon: React.ElementType
  bgColor: string
  textColor: string
  description?: string
}> = {
  not_submitted: {
    label: 'Sin presentar',
    icon: Clock,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700'
  },
  oportunidad: {
    label: 'Pendiente de CI',
    icon: Clock,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    description: 'Esperando decisión del Comité de Inversión'
  },
  rechazado_ci: {
    label: 'Rechazado por CI',
    icon: XCircle,
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-800',
    description: 'El Comité de Inversión no aprobó esta oportunidad'
  },
  oferta_autorizada: {
    label: 'Oferta Autorizada',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    description: 'CI aprobó. Pendiente de presentar oferta al vendedor'
  },
  oferta_presentada: {
    label: 'Oferta Presentada',
    icon: Clock,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Esperando respuesta del vendedor'
  },
  oferta_rechazada: {
    label: 'Oferta Rechazada',
    icon: XCircle,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    description: 'El vendedor rechazó la oferta'
  },
  oferta_aceptada: {
    label: 'Oferta Aceptada',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    description: 'El vendedor aceptó. Proyecto en marcha'
  },
  en_ejecucion: {
    label: 'En Ejecución',
    icon: CheckCircle2,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Proyecto en fase de obras'
  },
  en_venta: {
    label: 'En Venta',
    icon: CheckCircle2,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    description: 'Proyecto en comercialización'
  },
  vendido: {
    label: 'Vendido',
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    description: 'Proyecto cerrado'
  }
}

export function ProjectHeader({
  title,
  versionNumber,
  onSave,
  onShare,
  onPrint,
  onVersionHistory,
  onSubmitToCI,
  hasChanges,
  saving,
  submittingToCI,
  ciStatus = 'not_submitted',
  ciProjectCode,
  ciRejectionReason
}: ProjectHeaderProps) {
  const config = statusConfig[ciStatus]
  const StatusIcon = config.icon
  const canSubmitToCI = ciStatus === 'not_submitted' && onSubmitToCI
  const isSubmitted = ciStatus !== 'not_submitted'

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h1>
          {ciProjectCode && (
            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
              {ciProjectCode}
            </span>
          )}
        </div>

        {hasChanges && (
          <span className="inline-flex items-center gap-1 text-sm text-orange-600">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Cambios sin guardar
          </span>
        )}

        {/* Mostrar razón de rechazo si aplica */}
        {ciStatus === 'rechazado_ci' && ciRejectionReason && (
          <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg max-w-md">
            <p className="text-sm text-rose-800">
              <strong>Motivo del rechazo:</strong> {ciRejectionReason}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {versionNumber && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground"
              onClick={onVersionHistory}
            >
              <History className="h-3.5 w-3.5" />
              <span>v{versionNumber}</span>
            </Button>
            <div className="h-4 w-px bg-border" />
          </>
        )}

        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onShare}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onPrint}>
          <Printer className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          onClick={onSave}
          disabled={saving}
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'Guardando...' : 'Guardar'}</span>
        </Button>

        {/* Botón para presentar al CI (solo si no está presentado) */}
        {canSubmitToCI && (
          <>
            <div className="h-4 w-px bg-border" />
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onSubmitToCI}
              disabled={submittingToCI || hasChanges}
              title={hasChanges ? 'Guarda los cambios primero' : 'Enviar al Comité de Inversión'}
            >
              <SendHorizonal className="h-3.5 w-3.5" />
              <span>{submittingToCI ? 'Enviando...' : 'Presentar al CI'}</span>
            </Button>
          </>
        )}

        {/* Badge de estado del CI */}
        {isSubmitted && (
          <>
            <div className="h-4 w-px bg-border" />
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${config.bgColor} ${config.textColor}`}>
              <StatusIcon className="h-4 w-4" />
              {config.label}
            </span>
          </>
        )}

        {/* Enlace al proyecto si está aceptado o más allá */}
        {(ciStatus === 'oferta_aceptada' || ciStatus === 'en_ejecucion' || ciStatus === 'en_venta' || ciStatus === 'vendido') && ciProjectCode && (
          <Link
            href={`/proyectos/${ciProjectCode}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver Proyecto
          </Link>
        )}
      </div>
    </header>
  )
}
