'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useFullCalculator, useProjectMutations } from '@/hooks'
import { StepIndicator } from './StepIndicator'
import { Step1Property } from './Step1Property'
import { Step2Financial } from './Step2Financial'
import { Step3Summary } from './Step3Summary'
import { X } from 'lucide-react'

interface CalculatorWizardProps {
  onClose?: () => void
  onSuccess?: (projectId: string) => void
}

export function CalculatorWizard({ onClose, onSuccess }: CalculatorWizardProps) {
  const router = useRouter()
  const {
    state,
    results,
    currentStep,
    loading,
    error,
    updateState,
    setStep,
    calculate,
    reset,
    saveSnapshot
  } = useFullCalculator()

  const { createProject } = useProjectMutations()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setStep(currentStep + 1)
    }
  }, [currentStep, setStep])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setStep(currentStep - 1)
    }
  }, [currentStep, setStep])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveError(null)

    try {
      // 1. Crear el proyecto en projects_v2
      const project = await createProject({
        property_address: state.propertyAddress,
        property_city: state.propertyCity,
        property_district: state.propertyDistrict || undefined,
        property_size_m2: state.propertySizeM2,
        property_bedrooms: state.propertyBedrooms,
        property_bathrooms: state.propertyBathrooms,
        purchase_price: state.purchasePrice,
        estimated_sale_price: state.estimatedSalePrice,
        renovation_type: state.renovationType,
        notes: state.notes || undefined
      })

      // 2. Guardar el snapshot de la calculadora
      if (results.metrics) {
        await saveSnapshot(project.project_id)
      }

      // 3. Éxito: llamar callback o redirigir
      if (onSuccess) {
        onSuccess(project.project_id)
      } else {
        // Redirigir a la lista de oportunidades
        router.push('/calculadora')
      }

      // Resetear el wizard
      reset()

    } catch (err) {
      console.error('Error saving project:', err)
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el proyecto')
    } finally {
      setSaving(false)
    }
  }, [state, results, createProject, saveSnapshot, reset, router, onSuccess])

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      router.push('/calculadora')
    }
  }, [onClose, router])

  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nueva Oportunidad</h2>
          <p className="text-sm text-gray-500">Analiza la rentabilidad de un nuevo proyecto</p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="px-6 pt-6">
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error global */}
        {(error || saveError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="font-medium">Error</div>
            <div className="text-sm">{error?.message || saveError}</div>
          </div>
        )}

        {/* Steps */}
        {currentStep === 1 && (
          <Step1Property
            state={state}
            updateState={updateState}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <Step2Financial
            state={state}
            updateState={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <Step3Summary
            state={state}
            results={results}
            updateState={updateState}
            calculate={calculate}
            loading={loading}
            onBack={handleBack}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}
