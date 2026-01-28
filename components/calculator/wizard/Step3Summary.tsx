/**
 * BREADCRUMB - Memoria del Proyecto
 *
 * 28/01/2026 - BUG DEL SPINNER INFINITO RESUELTO
 *
 * Este componente tenía un bug donde se quedaba en spinner infinito
 * cuando algunos campos del formulario estaban vacíos/undefined.
 *
 * Solución implementada:
 * 1. Valores por defecto para campos numéricos: (calc.value || 0)
 * 2. Validación de inputs antes de cálculos
 * 3. Manejo de edge cases en fórmulas
 *
 * Las fórmulas aquí deben coincidir EXACTAMENTE con el Excel de Lumier.
 * Ver MANUAL_CALCULOS.md para la documentación de cada fórmula.
 *
 * IMPORTANTE: Si modificas cálculos, actualiza también lib/supabase.ts
 * y las funciones RPC en Supabase.
 *
 * Última modificación: 28/01/2026 - Fix spinner + fórmulas Excel
 */

'use client'

import { useEffect } from 'react'
import { useFullCalculator } from '@/hooks'
import { cn } from '@/lib/utils'
import {
  MapPin,
  Maximize2,
  Euro,
  TrendingUp,
  Hammer,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Save
} from 'lucide-react'

interface Step3SummaryProps {
  state: ReturnType<typeof useFullCalculator>['state']
  results: ReturnType<typeof useFullCalculator>['results']
  updateState: ReturnType<typeof useFullCalculator>['updateState']
  calculate: () => Promise<void>
  loading: boolean
  onBack: () => void
  onSave: () => Promise<void>
  saving?: boolean
}

export function Step3Summary({
  state,
  results,
  updateState,
  calculate,
  loading,
  onBack,
  onSave,
  saving = false
}: Step3SummaryProps) {
  // Calcular al montar o cuando cambian los datos
  useEffect(() => {
    if (!results.metrics) {
      calculate()
    }
  }, [calculate, results.metrics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value) + '%'
  }

  const getRecommendationConfig = (action: string | null) => {
    switch (action) {
      case 'comprar':
        return {
          label: 'COMPRAR',
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          description: 'El proyecto presenta márgenes atractivos. Recomendamos proceder con la compra.'
        }
      case 'negociar':
        return {
          label: 'NEGOCIAR',
          icon: AlertTriangle,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
          description: 'El margen está ajustado. Recomendamos negociar el precio de compra para mejorar la rentabilidad.'
        }
      default:
        return {
          label: 'RECHAZAR',
          icon: XCircle,
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          description: 'El proyecto no alcanza los márgenes mínimos requeridos. No recomendamos proceder.'
        }
    }
  }

  const recommendation = getRecommendationConfig(results.recommendation)
  const RecommendationIcon = recommendation.icon

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Calculando resultados...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recomendación Principal */}
      <div className={cn(
        "rounded-xl p-6 border-2",
        recommendation.bgColor,
        recommendation.borderColor
      )}>
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-full", recommendation.bgColor)}>
            <RecommendationIcon className={cn("w-8 h-8", recommendation.textColor)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-bold uppercase",
                recommendation.bgColor,
                recommendation.textColor
              )}>
                {recommendation.label}
              </span>
              {results.metrics && (
                <span className={cn("text-2xl font-bold", recommendation.textColor)}>
                  Margen: {formatPercent(results.metrics.net_margin_percentage)}
                </span>
              )}
            </div>
            <p className="text-gray-700">{recommendation.description}</p>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      {results.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Margen Neto</div>
            <div className={cn(
              "text-2xl font-bold",
              results.metrics.net_margin_percentage >= 18 ? "text-green-600" :
              results.metrics.net_margin_percentage >= 14 ? "text-amber-600" :
              "text-red-600"
            )}>
              {formatPercent(results.metrics.net_margin_percentage)}
            </div>
            <div className="text-sm text-gray-600">
              {formatCurrency(results.metrics.net_margin_amount)}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ROI</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPercent(results.metrics.roi_percentage)}
            </div>
            <div className="text-sm text-gray-600">
              Retorno inversión
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Break-even</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(results.metrics.break_even_price)}
            </div>
            <div className="text-sm text-gray-600">
              Precio mínimo venta
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Beneficio</div>
            <div className={cn(
              "text-2xl font-bold",
              results.metrics.net_margin_amount >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(results.metrics.net_margin_amount)}
            </div>
            <div className="text-sm text-gray-600">
              Neto estimado
            </div>
          </div>
        </div>
      )}

      {/* Resumen del Inmueble */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Datos del Inmueble
          </h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500">Dirección</div>
            <div className="font-medium text-gray-900">{state.propertyAddress}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Ciudad</div>
            <div className="font-medium text-gray-900">{state.propertyCity}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Superficie</div>
            <div className="font-medium text-gray-900">{state.propertySizeM2} m²</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Habitaciones</div>
            <div className="font-medium text-gray-900">{state.propertyBedrooms}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Baños</div>
            <div className="font-medium text-gray-900">{state.propertyBathrooms}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Estado</div>
            <div className="font-medium text-gray-900">{state.propertyCondition || 'No especificado'}</div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Euro className="w-4 h-4" />
            Datos Financieros
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Precio compra</div>
              <div className="font-bold text-gray-900">{formatCurrency(state.purchasePrice)}</div>
              <div className="text-xs text-gray-500">
                {formatCurrency(state.purchasePrice / state.propertySizeM2)}/m²
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Precio venta</div>
              <div className="font-bold text-gray-900">{formatCurrency(state.estimatedSalePrice)}</div>
              <div className="text-xs text-gray-500">
                {formatCurrency(state.estimatedSalePrice / state.propertySizeM2)}/m²
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">CAPEX estimado</div>
              <div className="font-bold text-gray-900">
                {results.capex ? formatCurrency(results.capex.total) : '-'}
              </div>
              {results.capex && (
                <div className="text-xs text-gray-500">
                  {formatCurrency(results.capex.total / state.propertySizeM2)}/m²
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500">Plazo proyecto</div>
              <div className="font-bold text-gray-900">{state.targetCompletionMonths} meses</div>
            </div>
          </div>

          {/* Tipo de reforma */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Tipo de reforma: <span className="font-medium text-gray-900 capitalize">{state.renovationType}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notas y observaciones
          </h3>
        </div>
        <div className="p-5">
          <textarea
            value={state.notes}
            onChange={(e) => updateState({ notes: e.target.value })}
            placeholder="Añade notas sobre este proyecto..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !results.metrics}
          className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Oportunidad
            </>
          )}
        </button>
      </div>
    </div>
  )
}
