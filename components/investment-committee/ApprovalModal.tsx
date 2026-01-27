'use client'

import { useState } from 'react'
import { X, CheckCircle, Loader2 } from 'lucide-react'
import type { ProjectListItem } from '@/lib/types'

interface ApprovalModalProps {
  project: ProjectListItem
  isOpen: boolean
  onClose: () => void
  onConfirm: (notes?: string) => Promise<void>
}

export function ApprovalModal({
  project,
  isOpen,
  onClose,
  onConfirm
}: ApprovalModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      await onConfirm(notes || undefined)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar')
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Aprobar Oportunidad</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resumen del proyecto */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{project.property_address}</h3>
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
                <span className="ml-2 font-bold text-green-600">{project.net_margin_percentage?.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-500">ROI:</span>
                <span className="ml-2 font-medium">{project.roi_percentage?.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-4">
            ¿Confirmas la aprobación de esta oportunidad? El proyecto pasará a estado <strong>"Aprobado"</strong> y se podrá proceder con la compra.
          </p>

          {/* Notas opcionales */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notas de aprobación (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade comentarios sobre la aprobación..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Aprobando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmar Aprobación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
