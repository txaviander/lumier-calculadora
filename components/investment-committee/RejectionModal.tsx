'use client'

import { useState } from 'react'
import { X, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import type { ProjectListItem } from '@/lib/types'

interface RejectionModalProps {
  project: ProjectListItem
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

const REJECTION_REASONS = [
  { id: 'margin_low', label: 'Margen insuficiente', description: 'El margen neto no alcanza el mínimo requerido' },
  { id: 'location', label: 'Ubicación inadecuada', description: 'La zona no cumple con los criterios de inversión' },
  { id: 'price_high', label: 'Precio de compra excesivo', description: 'El precio solicitado supera el valor de mercado' },
  { id: 'renovation_complex', label: 'Reforma muy compleja', description: 'Los costes de reforma son demasiado elevados o arriesgados' },
  { id: 'market_risk', label: 'Riesgo de mercado', description: 'Condiciones de mercado desfavorables para esta inversión' },
  { id: 'financing', label: 'Problemas de financiación', description: 'Dificultades para obtener financiación adecuada' },
  { id: 'other', label: 'Otro motivo', description: 'Especificar en notas adicionales' }
]

export function RejectionModal({
  project,
  isOpen,
  onClose,
  onConfirm
}: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!selectedReason) {
      setError('Debes seleccionar un motivo de rechazo')
      return
    }

    if (selectedReason === 'other' && !additionalNotes.trim()) {
      setError('Por favor especifica el motivo en las notas adicionales')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const reasonLabel = REJECTION_REASONS.find(r => r.id === selectedReason)?.label || selectedReason
      const fullReason = additionalNotes.trim()
        ? `${reasonLabel}: ${additionalNotes.trim()}`
        : reasonLabel

      await onConfirm(fullReason)
      onClose()
      // Reset state
      setSelectedReason(null)
      setAdditionalNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Rechazar Oportunidad</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Resumen del proyecto */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{project.property_address}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Compra:</span>
                    <span className="ml-2 font-medium">{formatCurrency(project.purchase_price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Venta:</span>
                    <span className="ml-2 font-medium">{formatCurrency(project.estimated_sale_price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Margen:</span>
                    <span className="ml-2 font-medium text-red-600">{project.net_margin_percentage?.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ROI:</span>
                    <span className="ml-2 font-medium">{project.roi_percentage?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-4">
            Selecciona el motivo principal del rechazo:
          </p>

          {/* Motivos de rechazo */}
          <div className="space-y-2 mb-4">
            {REJECTION_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="rejection_reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={() => {
                    setSelectedReason(reason.id)
                    setError(null)
                  }}
                  className="mt-1 text-red-600 focus:ring-red-500"
                />
                <div>
                  <p className="font-medium text-gray-900">{reason.label}</p>
                  <p className="text-sm text-gray-500">{reason.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Notas adicionales */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notas adicionales {selectedReason === 'other' ? '(requerido)' : '(opcional)'}
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Añade detalles sobre el motivo del rechazo..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedReason}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rechazando...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Confirmar Rechazo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
