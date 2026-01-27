'use client'

import { cn } from '@/lib/utils'
import { Check, Home, Calculator, FileCheck } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps?: number
  steps?: { title: string; description: string }[]
}

const defaultSteps = [
  { title: 'Inmueble', description: 'Datos del inmueble' },
  { title: 'Financiero', description: 'Precios y CAPEX' },
  { title: 'Resumen', description: 'Revisar y guardar' }
]

const stepIcons = [Home, Calculator, FileCheck]

export function StepIndicator({
  currentStep,
  totalSteps = 3,
  steps = defaultSteps
}: StepIndicatorProps) {
  return (
    <nav aria-label="Progreso" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const Icon = stepIcons[index] || stepIcons[0]

          return (
            <li key={step.title} className="flex-1 relative">
              <div className="flex flex-col items-center">
                {/* Línea conectora */}
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-5 -left-1/2 w-full h-0.5",
                      isComplete || isCurrent ? "bg-gray-900" : "bg-gray-200"
                    )}
                    style={{ transform: 'translateX(0)' }}
                  />
                )}

                {/* Círculo del paso */}
                <div
                  className={cn(
                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isComplete
                      ? "bg-gray-900 border-gray-900"
                      : isCurrent
                      ? "bg-white border-gray-900"
                      : "bg-white border-gray-200"
                  )}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isCurrent ? "text-gray-900" : "text-gray-400"
                      )}
                    />
                  )}
                </div>

                {/* Etiquetas */}
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-gray-900" : isComplete ? "text-gray-700" : "text-gray-400"
                    )}
                  >
                    {step.title}
                  </span>
                  <p
                    className={cn(
                      "text-xs mt-0.5 hidden sm:block",
                      isCurrent ? "text-gray-600" : "text-gray-400"
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
