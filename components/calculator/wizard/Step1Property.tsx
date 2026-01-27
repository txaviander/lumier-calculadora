'use client'

import { useFullCalculator } from '@/hooks'
import { MapPin, Maximize2, Bed, Bath } from 'lucide-react'

interface Step1PropertyProps {
  state: ReturnType<typeof useFullCalculator>['state']
  updateState: ReturnType<typeof useFullCalculator>['updateState']
  onNext: () => void
}

export function Step1Property({ state, updateState, onNext }: Step1PropertyProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  const isValid = state.propertyAddress && state.propertySizeM2 > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Dirección del inmueble *
          </label>
          <input
            type="text"
            value={state.propertyAddress}
            onChange={(e) => updateState({ propertyAddress: e.target.value })}
            placeholder="Ej: Calle Gran Vía 42, 4º Izq"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
          />
        </div>

        {/* Ciudad y Distrito */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <select
              value={state.propertyCity}
              onChange={(e) => updateState({ propertyCity: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="Madrid">Madrid</option>
              <option value="Barcelona">Barcelona</option>
              <option value="Valencia">Valencia</option>
              <option value="Sevilla">Sevilla</option>
              <option value="Málaga">Málaga</option>
              <option value="Marbella">Marbella</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distrito / Barrio
            </label>
            <input
              type="text"
              value={state.propertyDistrict}
              onChange={(e) => updateState({ propertyDistrict: e.target.value })}
              placeholder="Ej: Salamanca"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Superficie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Maximize2 className="inline w-4 h-4 mr-1" />
            Superficie construida (m²) *
          </label>
          <input
            type="number"
            value={state.propertySizeM2 || ''}
            onChange={(e) => updateState({ propertySizeM2: parseFloat(e.target.value) || 0 })}
            placeholder="Ej: 120"
            min="1"
            max="2000"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Superficie total construida incluyendo zonas comunes proporcionales
          </p>
        </div>

        {/* Habitaciones y Baños */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Bed className="inline w-4 h-4 mr-1" />
              Habitaciones
            </label>
            <select
              value={state.propertyBedrooms}
              onChange={(e) => updateState({ propertyBedrooms: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} habitación{num > 1 ? 'es' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Bath className="inline w-4 h-4 mr-1" />
              Baños
            </label>
            <select
              value={state.propertyBathrooms}
              onChange={(e) => updateState({ propertyBathrooms: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                <option key={num} value={num}>{num} baño{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estado actual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado actual del inmueble
          </label>
          <select
            value={state.propertyCondition}
            onChange={(e) => updateState({ propertyCondition: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            <option value="nuevo">Nuevo / Sin estrenar</option>
            <option value="bueno">Buen estado (reformas menores)</option>
            <option value="regular">Estado regular (necesita actualización)</option>
            <option value="mal">Mal estado (reforma integral necesaria)</option>
            <option value="ruina">Muy deteriorado / Ruina</option>
          </select>
        </div>
      </div>

      {/* Botón siguiente */}
      <div className="flex justify-end pt-4 border-t">
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
