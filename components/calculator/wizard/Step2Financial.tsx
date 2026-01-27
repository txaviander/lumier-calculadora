'use client'

import { useState, useEffect } from 'react'
import { useFullCalculator, useCapexCalculator } from '@/hooks'
import { Euro, TrendingUp, Hammer, Calendar } from 'lucide-react'
import type { RenovationType } from '@/lib/types'

interface Step2FinancialProps {
  state: ReturnType<typeof useFullCalculator>['state']
  updateState: ReturnType<typeof useFullCalculator>['updateState']
  onNext: () => void
  onBack: () => void
}

const renovationOptions: { value: RenovationType; label: string; description: string; priceRange: string }[] = [
  {
    value: 'basica',
    label: 'Básica',
    description: 'Pintura, suelos, baño/cocina básicos',
    priceRange: '~400€/m²'
  },
  {
    value: 'media',
    label: 'Media',
    description: 'Reforma parcial con materiales estándar',
    priceRange: '~700€/m²'
  },
  {
    value: 'integral',
    label: 'Integral',
    description: 'Reforma completa con buenos acabados',
    priceRange: '~1.000€/m²'
  },
  {
    value: 'lujo',
    label: 'Lujo',
    description: 'Alta gama, materiales premium',
    priceRange: '~1.500€/m²'
  }
]

export function Step2Financial({ state, updateState, onNext, onBack }: Step2FinancialProps) {
  const { calculateCapex, capexResult, loading: capexLoading } = useCapexCalculator()
  const [estimatedCapex, setEstimatedCapex] = useState<number | null>(null)

  // Calcular CAPEX cuando cambian los parámetros relevantes
  useEffect(() => {
    const fetchCapex = async () => {
      if (state.propertySizeM2 > 0) {
        try {
          const result = await calculateCapex(state.propertySizeM2, state.renovationType)
          setEstimatedCapex(result.total)
        } catch (err) {
          console.error('Error calculating CAPEX:', err)
        }
      }
    }

    fetchCapex()
  }, [state.propertySizeM2, state.renovationType, calculateCapex])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  const isValid = state.purchasePrice > 0 && state.estimatedSalePrice > 0

  // Calcular preview de margen
  const previewMargin = (() => {
    if (!state.purchasePrice || !state.estimatedSalePrice || !estimatedCapex) return null
    const grossProfit = state.estimatedSalePrice - state.purchasePrice - estimatedCapex
    const margin = (grossProfit / state.estimatedSalePrice) * 100
    return margin
  })()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        {/* Precio de Compra */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Euro className="inline w-4 h-4 mr-1" />
            Precio de compra *
          </label>
          <div className="relative">
            <input
              type="number"
              value={state.purchasePrice || ''}
              onChange={(e) => updateState({ purchasePrice: parseFloat(e.target.value) || 0 })}
              placeholder="Ej: 500000"
              min="0"
              step="1000"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-12"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
          </div>
          {state.purchasePrice > 0 && state.propertySizeM2 > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(state.purchasePrice / state.propertySizeM2)}/m²
            </p>
          )}
        </div>

        {/* Precio de Venta Estimado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <TrendingUp className="inline w-4 h-4 mr-1" />
            Precio de venta estimado *
          </label>
          <div className="relative">
            <input
              type="number"
              value={state.estimatedSalePrice || ''}
              onChange={(e) => updateState({ estimatedSalePrice: parseFloat(e.target.value) || 0 })}
              placeholder="Ej: 750000"
              min="0"
              step="1000"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-12"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
          </div>
          {state.estimatedSalePrice > 0 && state.propertySizeM2 > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(state.estimatedSalePrice / state.propertySizeM2)}/m²
            </p>
          )}
        </div>

        {/* Tipo de Reforma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Hammer className="inline w-4 h-4 mr-1" />
            Tipo de reforma
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {renovationOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateState({ renovationType: option.value })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  state.renovationType === option.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                <div className="text-sm font-medium text-gray-700 mt-2">{option.priceRange}</div>
              </button>
            ))}
          </div>
        </div>

        {/* CAPEX Estimado */}
        {estimatedCapex !== null && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">CAPEX estimado</div>
                <div className="text-2xl font-bold text-gray-900">
                  {capexLoading ? (
                    <span className="text-gray-400">Calculando...</span>
                  ) : (
                    formatCurrency(estimatedCapex)
                  )}
                </div>
                {state.propertySizeM2 > 0 && (
                  <div className="text-xs text-gray-500">
                    {formatCurrency(estimatedCapex / state.propertySizeM2)}/m²
                  </div>
                )}
              </div>
              {capexResult && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Desglose principal:</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>Obra: {formatCurrency(capexResult.albanileria)}</div>
                    <div>Carpintería: {formatCurrency(capexResult.carpinteria)}</div>
                    <div>Instalaciones: {formatCurrency(capexResult.fontaneria + capexResult.electricidad)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plazo objetivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Plazo objetivo del proyecto (meses)
          </label>
          <select
            value={state.targetCompletionMonths}
            onChange={(e) => updateState({ targetCompletionMonths: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            {[4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 24].map(months => (
              <option key={months} value={months}>{months} meses</option>
            ))}
          </select>
        </div>

        {/* Preview de Margen */}
        {previewMargin !== null && (
          <div className={`rounded-lg p-4 border-2 ${
            previewMargin >= 18 ? 'bg-green-50 border-green-200' :
            previewMargin >= 14 ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Margen bruto estimado</div>
                <div className={`text-2xl font-bold ${
                  previewMargin >= 18 ? 'text-green-600' :
                  previewMargin >= 14 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {previewMargin.toFixed(1)}%
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                previewMargin >= 18 ? 'bg-green-100 text-green-700' :
                previewMargin >= 14 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {previewMargin >= 18 ? 'Comprar' :
                 previewMargin >= 14 ? 'Negociar' :
                 'Rechazar'}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Este es un cálculo preliminar. El margen neto final incluirá costes adicionales (~20%).
            </p>
          </div>
        )}
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
          type="submit"
          disabled={!isValid}
          className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Siguiente
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  )
}
