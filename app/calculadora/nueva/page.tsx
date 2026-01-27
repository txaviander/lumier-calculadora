'use client'

import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/dashboard'
import { CalculatorWizard } from '@/components/calculator'

export default function NuevaOportunidadPage() {
  return (
    <ProtectedRoute>
      <NuevaOportunidadContent />
    </ProtectedRoute>
  )
}

function NuevaOportunidadContent() {
  const router = useRouter()

  const handleClose = () => {
    router.push('/calculadora')
  }

  const handleSuccess = (projectId: string) => {
    // Redirigir a la lista de oportunidades con mensaje de éxito
    router.push('/calculadora?success=true')
  }

  return (
    <DashboardLayout
      title="Nueva Oportunidad"
      subtitle="Analiza la rentabilidad de un nuevo proyecto inmobiliario"
    >
      <div className="py-4">
        <CalculatorWizard
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  )
}
