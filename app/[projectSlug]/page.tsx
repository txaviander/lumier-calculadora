'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  Project,
  ProjectVersion,
  CalculatorData,
  getProjectBySlug,
  getProjectVersions,
  getActiveVersion,
  createVersion,
  setActiveVersion
} from '@/lib/supabase'

// Valores por defecto para nueva calculadora
const defaultCalculatorData: CalculatorData = {
  precioCompra: 0,
  impuestosCompra: 0,
  notariaCompra: 0,
  registroCompra: 0,
  gestoriaCompra: 0,
  otrosGastosCompra: 0,
  totalReforma: 0,
  honorariosReforma: 0,
  capitalPropio: 0,
  prestamo: 0,
  interesPrestamo: 0,
  mesesPrestamo: 12,
  fechaCompra: new Date().toISOString().split('T')[0],
  fechaInicioReforma: new Date().toISOString().split('T')[0],
  fechaFinReforma: new Date().toISOString().split('T')[0],
  fechaVenta: new Date().toISOString().split('T')[0],
  precioVenta: 0,
  comisionVenta: 0,
  plusvalia: 0,
  notariaVenta: 0,
  gestoriaVenta: 0,
  otrosGastosVenta: 0,
  cancelacionHipoteca: 0
}

export default function ProjectCalculatorPage() {
  return (
    <ProtectedRoute>
      <CalculatorContent />
    </ProtectedRoute>
  )
}

function CalculatorContent() {
  const params = useParams()
  const projectSlug = params.projectSlug as string

  const [project, setProject] = useState<Project | null>(null)
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [activeVersionData, setActiveVersionData] = useState<ProjectVersion | null>(null)
  const [data, setData] = useState<CalculatorData>(defaultCalculatorData)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [showVersionSelector, setShowVersionSelector] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Cargar proyecto y versiones
  useEffect(() => {
    async function loadProject() {
      try {
        const projectData = await getProjectBySlug(projectSlug)
        if (!projectData) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setProject(projectData)

        const [versionsData, activeVersion] = await Promise.all([
          getProjectVersions(projectData.id),
          getActiveVersion(projectData.id)
        ])

        setVersions(versionsData)

        if (activeVersion) {
          setActiveVersionData(activeVersion)
          setData(activeVersion.data)
        }
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectSlug])

  // Detectar cambios
  const updateField = useCallback((field: keyof CalculatorData, value: number | string) => {
    setData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }, [])

  // Guardar nueva version
  async function handleSaveVersion(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !newVersionName.trim()) return

    setSaving(true)
    try {
      const newVersion = await createVersion(project.id, newVersionName, data)
      setVersions([newVersion, ...versions])
      setActiveVersionData(newVersion)
      setNewVersionName('')
      setShowVersionModal(false)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving version:', error)
      alert('Error al guardar la version')
    } finally {
      setSaving(false)
    }
  }

  // Cambiar version activa
  async function handleSelectVersion(version: ProjectVersion) {
    if (!project) return

    try {
      await setActiveVersion(project.id, version.id)
      setActiveVersionData(version)
      setData(version.data)
      setVersions(versions.map(v => ({
        ...v,
        is_active: v.id === version.id
      })))
      setShowVersionSelector(false)
      setHasChanges(false)
    } catch (error) {
      console.error('Error changing version:', error)
    }
  }

  // Calculos
  const totalGastosCompra = data.precioCompra + data.impuestosCompra + data.notariaCompra +
    data.registroCompra + data.gestoriaCompra + data.otrosGastosCompra

  const totalInversionReforma = data.totalReforma + data.honorariosReforma

  const interesesPrestamo = data.prestamo * (data.interesPrestamo / 100) * (data.mesesPrestamo / 12)

  const totalInversion = totalGastosCompra + totalInversionReforma + interesesPrestamo

  const totalGastosVenta = data.comisionVenta + data.plusvalia + data.notariaVenta +
    data.gestoriaVenta + data.otrosGastosVenta + data.cancelacionHipoteca

  const beneficioBruto = data.precioVenta - totalGastosVenta - totalInversion
  const rentabilidad = totalInversion > 0 ? (beneficioBruto / totalInversion) * 100 : 0

  // Calcular dias del proyecto
  const calcularDias = () => {
    const fechaInicio = new Date(data.fechaCompra)
    const fechaFin = new Date(data.fechaVenta)
    const diffTime = fechaFin.getTime() - fechaInicio.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Calcular TIR anualizada
  const calcularTIR = () => {
    const dias = calcularDias()
    if (dias <= 0 || totalInversion <= 0) return 0
    const rentabilidadDecimal = beneficioBruto / totalInversion
    const tirAnualizada = Math.pow(1 + rentabilidadDecimal, 365 / dias) - 1
    return tirAnualizada * 100
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Copiar URL
  const copyShareUrl = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('URL copiada al portapapeles')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumier-gold"></div>
      </div>
    )
  }

  // Not found
  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Proyecto no encontrado</h1>
          <p className="text-gray-500 mb-6">El proyecto que buscas no existe o ha sido eliminado.</p>
          <a href="/" className="bg-lumier-gold text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors">
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header projectName={project?.name} showBackButton />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Toolbar */}
        <div className="bg-white rounded-xl card-shadow p-4 mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-4">
            {/* Version selector */}
            <div className="relative">
              <button
                onClick={() => setShowVersionSelector(!showVersionSelector)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  {activeVersionData ? `v${activeVersionData.version_number}: ${activeVersionData.version_name}` : 'Sin versiones'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showVersionSelector && versions.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Versiones</div>
                    {versions.map((version) => (
                      <button
                        key={version.id}
                        onClick={() => handleSelectVersion(version)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          version.is_active ? 'bg-lumier-gold/10 text-lumier-gold' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">v{version.version_number}: {version.version_name}</div>
                        <div className="text-xs text-gray-400">{formatDate(version.created_at)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hasChanges && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Cambios sin guardar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyShareUrl}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Copiar URL para compartir"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Compartir</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={() => setShowVersionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-lumier-gold text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Guardar Version
            </button>
          </div>
        </div>

        {/* Modal guardar version */}
        {showVersionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Guardar Nueva Version</h2>
                <p className="text-sm text-gray-500 mt-1">Crea un punto de guardado para esta calculadora</p>
              </div>
              <form onSubmit={handleSaveVersion} className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la version *
                  </label>
                  <input
                    type="text"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="Ej: Presupuesto Final, Escenario Optimista..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lumier-gold focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowVersionModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !newVersionName.trim()}
                    className="flex-1 px-4 py-3 bg-lumier-gold text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Column 1: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Compra */}
            <Section title="Compra del Inmueble" color="bg-blue-500">
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Precio de Compra" value={data.precioCompra} onChange={v => updateField('precioCompra', v)} suffix="€" />
                <InputField label="Impuestos (ITP/IVA)" value={data.impuestosCompra} onChange={v => updateField('impuestosCompra', v)} suffix="€" />
                <InputField label="Notaria" value={data.notariaCompra} onChange={v => updateField('notariaCompra', v)} suffix="€" />
                <InputField label="Registro" value={data.registroCompra} onChange={v => updateField('registroCompra', v)} suffix="€" />
                <InputField label="Gestoria" value={data.gestoriaCompra} onChange={v => updateField('gestoriaCompra', v)} suffix="€" />
                <InputField label="Otros Gastos" value={data.otrosGastosCompra} onChange={v => updateField('otrosGastosCompra', v)} suffix="€" />
              </div>
              <ResultRow label="Total Gastos Compra" value={totalGastosCompra} className="mt-4 pt-4 border-t" />
            </Section>

            {/* Reforma */}
            <Section title="Reforma" color="bg-orange-500">
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Coste Total Reforma" value={data.totalReforma} onChange={v => updateField('totalReforma', v)} suffix="€" />
                <InputField label="Honorarios (Arquitecto, etc.)" value={data.honorariosReforma} onChange={v => updateField('honorariosReforma', v)} suffix="€" />
              </div>
              <ResultRow label="Total Inversion Reforma" value={totalInversionReforma} className="mt-4 pt-4 border-t" />
            </Section>

            {/* Financiacion */}
            <Section title="Financiacion" color="bg-purple-500">
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Capital Propio" value={data.capitalPropio} onChange={v => updateField('capitalPropio', v)} suffix="€" />
                <InputField label="Prestamo" value={data.prestamo} onChange={v => updateField('prestamo', v)} suffix="€" />
                <InputField label="Interes Anual" value={data.interesPrestamo} onChange={v => updateField('interesPrestamo', v)} suffix="%" step="0.1" />
                <InputField label="Duracion" value={data.mesesPrestamo} onChange={v => updateField('mesesPrestamo', v)} suffix="meses" />
              </div>
              <ResultRow label="Intereses Totales" value={interesesPrestamo} className="mt-4 pt-4 border-t" />
            </Section>

            {/* Fechas */}
            <Section title="Cronograma" color="bg-teal-500">
              <div className="grid sm:grid-cols-2 gap-4">
                <DateField label="Fecha Compra" value={data.fechaCompra} onChange={v => updateField('fechaCompra', v)} />
                <DateField label="Inicio Reforma" value={data.fechaInicioReforma} onChange={v => updateField('fechaInicioReforma', v)} />
                <DateField label="Fin Reforma" value={data.fechaFinReforma} onChange={v => updateField('fechaFinReforma', v)} />
                <DateField label="Fecha Venta" value={data.fechaVenta} onChange={v => updateField('fechaVenta', v)} />
              </div>
              <div className="mt-4 pt-4 border-t text-center">
                <span className="text-gray-500">Duracion Total del Proyecto:</span>
                <span className="font-bold text-lg ml-2">{calcularDias()} dias</span>
              </div>
            </Section>

            {/* Venta */}
            <Section title="Venta" color="bg-green-500">
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Precio de Venta" value={data.precioVenta} onChange={v => updateField('precioVenta', v)} suffix="€" />
                <InputField label="Comision Venta" value={data.comisionVenta} onChange={v => updateField('comisionVenta', v)} suffix="€" />
                <InputField label="Plusvalia Municipal" value={data.plusvalia} onChange={v => updateField('plusvalia', v)} suffix="€" />
                <InputField label="Notaria Venta" value={data.notariaVenta} onChange={v => updateField('notariaVenta', v)} suffix="€" />
                <InputField label="Gestoria Venta" value={data.gestoriaVenta} onChange={v => updateField('gestoriaVenta', v)} suffix="€" />
                <InputField label="Cancelacion Hipoteca" value={data.cancelacionHipoteca} onChange={v => updateField('cancelacionHipoteca', v)} suffix="€" />
                <InputField label="Otros Gastos Venta" value={data.otrosGastosVenta} onChange={v => updateField('otrosGastosVenta', v)} suffix="€" />
              </div>
              <ResultRow label="Total Gastos Venta" value={totalGastosVenta} className="mt-4 pt-4 border-t" />
            </Section>
          </div>

          {/* Column 2: Results */}
          <div className="space-y-6">
            {/* Resumen de Rentabilidad */}
            <div className="bg-gradient-to-br from-lumier-black to-gray-800 text-white rounded-xl p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-lumier-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
                Resumen de Rentabilidad
              </h3>

              <div className="space-y-4">
                <ResultBlock label="Total Inversion" value={totalInversion} />
                <ResultBlock label="Precio Venta" value={data.precioVenta} />
                <ResultBlock label="Gastos Venta" value={totalGastosVenta} negative />

                <div className="border-t border-gray-600 pt-4 mt-4">
                  <ResultBlock
                    label="Beneficio Neto"
                    value={beneficioBruto}
                    highlight
                    positive={beneficioBruto > 0}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 uppercase">ROI</div>
                    <div className={`text-2xl font-bold ${rentabilidad >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {rentabilidad.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 uppercase">TIR Anual</div>
                    <div className={`text-2xl font-bold ${calcularTIR() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {calcularTIR().toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 text-center mt-2">
                  Proyecto: {calcularDias()} dias ({(calcularDias() / 30).toFixed(1)} meses)
                </div>
              </div>
            </div>

            {/* Desglose */}
            <div className="bg-white rounded-xl card-shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">Desglose de Costes</h3>
              <div className="space-y-3 text-sm">
                <CostRow label="Compra + Gastos" value={totalGastosCompra} total={totalInversion} />
                <CostRow label="Reforma + Honorarios" value={totalInversionReforma} total={totalInversion} />
                <CostRow label="Intereses" value={interesesPrestamo} total={totalInversion} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Componentes auxiliares
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl card-shadow overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`}></span>
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  suffix,
  step = "1"
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix: string
  step?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lumier-gold focus:border-transparent text-right"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>
      </div>
    </div>
  )
}

function DateField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lumier-gold focus:border-transparent"
      />
    </div>
  )
}

function ResultRow({ label, value, className = '' }: { label: string; value: number; className?: string }) {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <span className="font-medium text-gray-700">{label}</span>
      <span className="font-bold text-lg">{new Intl.NumberFormat('es-ES').format(value)} €</span>
    </div>
  )
}

function ResultBlock({
  label,
  value,
  highlight = false,
  positive = true,
  negative = false
}: {
  label: string
  value: number
  highlight?: boolean
  positive?: boolean
  negative?: boolean
}) {
  const formatNum = (n: number) => new Intl.NumberFormat('es-ES').format(Math.abs(n))

  return (
    <div className={`flex justify-between items-center ${highlight ? 'text-xl' : ''}`}>
      <span className="text-gray-300">{label}</span>
      <span className={`font-bold ${highlight ? (positive ? 'text-green-400' : 'text-red-400') : negative ? 'text-red-400' : 'text-white'}`}>
        {negative ? '-' : ''}{formatNum(value)} €
      </span>
    </div>
  )
}

function CostRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{new Intl.NumberFormat('es-ES').format(value)} €</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-lumier-gold rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-400 text-right">{percentage.toFixed(1)}%</div>
    </div>
  )
}
