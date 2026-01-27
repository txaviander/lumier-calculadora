"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SendHorizonal, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

interface SubmitToCIModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  projectData: {
    direccion: string
    ciudad: string
    m2Totales: number
    precioCompra: number
    precioVenta: number
    margen: number
    roi: number
    beneficioNeto: number
  }
}

// Función para obtener la recomendación basada en el margen
function getRecommendation(margin: number): { action: string; color: string; bgColor: string } {
  if (margin >= 18) {
    return { action: 'COMPRAR', color: 'text-emerald-700', bgColor: 'bg-emerald-100' }
  }
  if (margin >= 14) {
    return { action: 'NEGOCIAR', color: 'text-amber-700', bgColor: 'bg-amber-100' }
  }
  return { action: 'RECHAZAR', color: 'text-rose-700', bgColor: 'bg-rose-100' }
}

export function SubmitToCIModal({ isOpen, onClose, onConfirm, projectData }: SubmitToCIModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
  }

  const recommendation = getRecommendation(projectData.margen)
  const isLowMargin = projectData.margen < 14

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar al Comité de Inversión')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-2xl p-6 w-[500px] max-w-[90vw] border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <SendHorizonal className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Presentar al Comité de Inversión</h3>
            <p className="text-sm text-muted-foreground">Esta oportunidad será revisada por el CI</p>
          </div>
        </div>

        {/* Resumen del proyecto */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-foreground mb-3">{projectData.direccion}</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Ciudad:</span>
              <span className="ml-2 font-medium">{projectData.ciudad}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Superficie:</span>
              <span className="ml-2 font-medium">{projectData.m2Totales} m²</span>
            </div>
            <div>
              <span className="text-muted-foreground">Precio Compra:</span>
              <span className="ml-2 font-medium">{formatCurrency(projectData.precioCompra)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Precio Venta:</span>
              <span className="ml-2 font-medium">{formatCurrency(projectData.precioVenta)}</span>
            </div>
          </div>
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Margen Neto</div>
            <div className={`text-lg font-bold ${projectData.margen >= 14 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {projectData.margen.toFixed(1)}%
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">ROI</div>
            <div className={`text-lg font-bold ${projectData.roi >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {projectData.roi.toFixed(1)}%
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Beneficio</div>
            <div className={`text-lg font-bold ${projectData.beneficioNeto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(projectData.beneficioNeto)}
            </div>
          </div>
        </div>

        {/* Recomendación automática */}
        <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 ${recommendation.bgColor}`}>
          {projectData.margen >= 14 ? (
            <TrendingUp className={`h-5 w-5 ${recommendation.color}`} />
          ) : (
            <TrendingDown className={`h-5 w-5 ${recommendation.color}`} />
          )}
          <span className={`font-medium ${recommendation.color}`}>
            Recomendación automática: {recommendation.action}
          </span>
        </div>

        {/* Warning si el margen es bajo */}
        {isLowMargin && (
          <div className="rounded-lg p-3 mb-4 bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Atención:</strong> Este proyecto tiene un margen por debajo del 14%.
              Es probable que sea rechazado por el Comité de Inversión.
              Considera negociar un mejor precio de compra.
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <SendHorizonal className="h-4 w-4" />
            {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
