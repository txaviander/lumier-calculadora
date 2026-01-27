'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/dashboard'
import { useAuth } from '@/components/AuthProvider'
import {
  Project,
  ProjectVersion,
  CalculatorData,
  Comentario,
  getProjectBySlug,
  getProjectVersions,
  getActiveVersion,
  createVersion,
  setActiveVersion
} from '@/lib/supabase'
import {
  ProjectHeader,
  KeyMetrics,
  PropertyDetails,
  TransactionCard,
  RenovationModule,
  ProfitLossSummary,
  SensitivityMatrix
} from '@/components/calculator'
import { ChevronDown, ChevronUp, Pencil, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Funciones de formato
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const formatNumberInput = (value: number | string) => {
  if (value === '' || value === null || value === undefined) return ''
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(num)
}

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100)
}

// Funciones de calculo
const calculateForQuality = (qualityLevel: number, params: {
  m2Construidos: number
  m2ZZCC: number
  precioCompra: number
  intermediacionCompra: boolean
  porcentajeIntermediacionCompra: number
  intermediacionVenta: boolean
  porcentajeIntermediacionVenta: number
  esClasico: boolean
  terrazaM2: number
  toldoPergola: boolean
  deuda: number
  interesFinanciero: number
}) => {
  const honorarioCompraBase = params.intermediacionCompra ? params.precioCompra * (params.porcentajeIntermediacionCompra / 100) : 0
  const honorarioCompra = honorarioCompraBase * 1.21
  const inscripcionEscritura = 145.2 + params.precioCompra * 0.0008 + params.precioCompra * 0.0005
  const totalAdquisicion = params.precioCompra + honorarioCompra + inscripcionEscritura + params.precioCompra * 0.02
  const costeObraBase: Record<number, number> = { 1: 437, 2: 540, 3: 631, 4: 631, 5: 631 }
  const obra = params.m2Construidos * (costeObraBase[qualityLevel] || 631)
  const costeCalidadBase: Record<number, number> = { 1: 392, 2: 484, 3: 545, 4: 900, 5: 1149 }
  const calidadCoste = params.m2Construidos * (costeCalidadBase[qualityLevel] || 545)
  const interiorismo = calidadCoste * 0.15 + (params.esClasico ? 790 : 0)
  const costeMobiliarioBase: Record<number, number> = { 1: 27, 2: 36, 3: 86, 4: 108, 5: 146 }
  const mobiliarioBase = params.m2Construidos * (costeMobiliarioBase[qualityLevel] || 86)
  const logisticaBase: Record<number, number> = { 1: 800, 2: 800, 3: 900, 4: 1600, 5: 1800 }
  const mobiliario = mobiliarioBase + (logisticaBase[qualityLevel] || 900) + mobiliarioBase * 0.11
  const terrazaCost = params.terrazaM2 > 0 ? params.terrazaM2 * 36.5 : 0
  const toldoCost = params.toldoPergola ? 2500 : 0
  const hardCosts = obra + calidadCoste + interiorismo + mobiliario + terrazaCost + toldoCost
  const arquitecturaFija: Record<number, number> = { 1: 3630, 2: 3630, 3: 6050, 4: 12100, 5: 18150 }
  const arquitectura = arquitecturaFija[qualityLevel] || 6050
  const softCosts = arquitectura + params.m2Construidos * 42.21 + 800 + 2490
  const totalGastos = hardCosts + softCosts
  const interesProyecto = params.deuda * (params.interesFinanciero / 100) / 2
  const inversionBase = totalAdquisicion + totalGastos + interesProyecto
  return { qualityLevel, obra, calidadCoste, interiorismo, mobiliario, hardCosts, softCosts, totalGastos, inversionBase, totalAdquisicion, interesProyecto }
}

// Valores por defecto
const getDefaultFechaCompra = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const getDefaultFechaVenta = () => {
  const today = new Date()
  today.setMonth(today.getMonth() + 7)
  return today.toISOString().split('T')[0]
}

const defaultCalculatorData: CalculatorData = {
  ciudad: "Madrid",
  direccion: "",
  planta: "2",
  m2Construidos: 158,
  m2ZZCC: 11,
  terrazaM2: 2,
  exterior: "Exterior",
  ascensor: true,
  portero: true,
  ite: true,
  garaje: false,
  toldoPergola: false,
  precioCompra: 1065000,
  fechaCompra: getDefaultFechaCompra(),
  intermediacionCompra: false,
  porcentajeIntermediacionCompra: 3,
  precioVenta: 1600000,
  fechaVenta: getDefaultFechaVenta(),
  intermediacionVenta: true,
  porcentajeIntermediacionVenta: 3,
  calidad: 3,
  habitaciones: 3,
  banos: 3,
  esClasico: false,
  ventanas: 20,
  calefaccion: "CENTRAL",
  climatizacion: "CONDUCTOS",
  extras: 0,
  deuda: 500000,
  interesFinanciero: 6.25,
  comentarios: []
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
  const { user } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [activeVersionData, setActiveVersionData] = useState<ProjectVersion | null>(null)
  const [data, setData] = useState<CalculatorData>(defaultCalculatorData)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)

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
          const mergedData = { ...defaultCalculatorData, ...activeVersion.data }
          if (!mergedData.direccion && projectData.name) {
            mergedData.direccion = projectData.name
          }
          setData(mergedData)
        } else {
          if (projectData.name) {
            setData(prev => ({ ...prev, direccion: projectData.name }))
          }
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
  const updateField = useCallback(<K extends keyof CalculatorData>(field: K, value: CalculatorData[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }, [])

  // Guardar nueva version
  async function handleSaveVersion(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!project) return

    // Si hay nombre, usar el modal normal
    if (showVersionModal && newVersionName.trim()) {
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
    } else {
      // Guardar rápido con nombre automático
      setSaving(true)
      try {
        const versionName = `v${versions.length + 1} - ${new Date().toLocaleDateString('es-ES')}`
        const newVersion = await createVersion(project.id, versionName, data)
        setVersions([newVersion, ...versions])
        setActiveVersionData(newVersion)
        setHasChanges(false)
      } catch (error) {
        console.error('Error saving version:', error)
        alert('Error al guardar la version')
      } finally {
        setSaving(false)
      }
    }
  }

  // Cambiar version activa
  async function handleSelectVersion(version: ProjectVersion) {
    if (!project) return

    try {
      await setActiveVersion(project.id, version.id)
      setActiveVersionData(version)
      setData({ ...defaultCalculatorData, ...version.data })
      setVersions(versions.map(v => ({
        ...v,
        is_active: v.id === version.id
      })))
      setHasChanges(false)
    } catch (error) {
      console.error('Error changing version:', error)
    }
  }

  // Agregar comentario
  const agregarComentario = () => {
    if (!nuevoComentario.trim() || !user) return
    const nuevo: Comentario = {
      id: Date.now(),
      texto: nuevoComentario.trim(),
      autor: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
      fecha: new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
    updateField('comentarios', [...(data.comentarios || []), nuevo])
    setNuevoComentario('')
  }

  const eliminarComentario = (id: number) => {
    updateField('comentarios', (data.comentarios || []).filter(c => c.id !== id))
  }

  // Calculos principales
  const calculations = useMemo(() => {
    const m2Totales = data.m2Construidos + data.m2ZZCC
    const honorarioCompraBase = data.intermediacionCompra ? data.precioCompra * (data.porcentajeIntermediacionCompra / 100) : 0
    const ivaHonorarioCompra = honorarioCompraBase * 0.21
    const honorarioCompra = honorarioCompraBase + ivaHonorarioCompra
    const inscripcionEscritura = 145.2 + data.precioCompra * 0.0008 + data.precioCompra * 0.0005
    const itp = data.precioCompra * 0.02
    const totalAdquisicion = data.precioCompra + honorarioCompra + inscripcionEscritura + itp

    // Hard Costs
    const costeObraBase: Record<number, number> = { 1: 437, 2: 540, 3: 631, 4: 631, 5: 631 }
    const obra = data.m2Construidos * (costeObraBase[data.calidad] || 631)
    const costeCalidadBase: Record<number, number> = { 1: 392, 2: 484, 3: 545, 4: 900, 5: 1149 }
    const calidadCoste = data.m2Construidos * (costeCalidadBase[data.calidad] || 545)
    const interiorismo = calidadCoste * 0.15 + (data.esClasico ? 790 : 0)
    const costeMobiliarioBase: Record<number, number> = { 1: 27, 2: 36, 3: 86, 4: 108, 5: 146 }
    const mobiliarioBase = data.m2Construidos * (costeMobiliarioBase[data.calidad] || 86)
    const logisticaBase: Record<number, number> = { 1: 800, 2: 800, 3: 900, 4: 1600, 5: 1800 }
    const mobiliario = mobiliarioBase + (logisticaBase[data.calidad] || 900) + mobiliarioBase * 0.11
    const terrazaCost = data.terrazaM2 > 0 ? data.terrazaM2 * 36.5 : 0
    const toldoCost = data.toldoPergola ? 2500 : 0
    const hardCosts = obra + calidadCoste + interiorismo + mobiliario + terrazaCost + toldoCost + data.extras

    // Soft Costs
    const arquitecturaFija: Record<number, number> = { 1: 3630, 2: 3630, 3: 6050, 4: 12100, 5: 18150 }
    const arquitectura = arquitecturaFija[data.calidad] || 6050
    const permisoConstruccion = data.m2Construidos * 42.21
    const gastosVenta = 800
    const costosTenencia = 2490
    const plusvalia = data.precioVenta * 0.00267
    const softCosts = arquitectura + permisoConstruccion + gastosVenta + costosTenencia + plusvalia
    const totalGastos = hardCosts + softCosts

    const honorariosVentaBase = data.intermediacionVenta ? data.precioVenta * (data.porcentajeIntermediacionVenta / 100) : 0
    const ivaHonorarioVenta = honorariosVentaBase * 0.21
    const honorariosVenta = honorariosVentaBase + ivaHonorarioVenta
    const ventaNeta = data.precioVenta - honorariosVenta
    const interesProyecto = data.deuda * (data.interesFinanciero / 100) / 2
    const equityNecesario = totalAdquisicion + totalGastos - data.deuda
    const inversionTotal = totalAdquisicion + totalGastos + interesProyecto
    const beneficioNeto = ventaNeta - inversionTotal
    const roi = (beneficioNeto / inversionTotal) * 100
    const margen = (beneficioNeto / data.precioVenta) * 100
    const euroM2Inversion = inversionTotal / m2Totales
    const euroM2Venta = data.precioVenta / m2Totales

    // Calculo de TIR
    const fechaCompraDate = new Date(data.fechaCompra)
    const fechaVentaDate = new Date(data.fechaVenta)
    const diffTime = fechaVentaDate.getTime() - fechaCompraDate.getTime()
    const diasProyecto = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    const mesesProyecto = diasProyecto / 30.44
    const tir = inversionTotal > 0 ? (Math.pow(ventaNeta / inversionTotal, 12 / mesesProyecto) - 1) * 100 : 0

    return {
      m2Totales, honorarioCompra, inscripcionEscritura, itp, totalAdquisicion, obra, calidadCoste, interiorismo,
      mobiliario, terrazaCost, extras: data.extras, hardCosts, arquitectura, permisoConstruccion, gastosVenta, costosTenencia,
      plusvalia, softCosts, totalGastos, honorariosVenta, ventaNeta, interesProyecto, equityNecesario, inversionTotal,
      beneficioNeto, roi, margen, euroM2Inversion, euroM2Venta, tir, mesesProyecto, diasProyecto, toldoCost
    }
  }, [data])

  const boolOptions = [{ value: "true", label: "Si" }, { value: "false", label: "No" }]

  const copyShareUrl = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('URL copiada al portapapeles')
  }

  // Breadcrumbs para navegacion
  const breadcrumbs = [
    { label: 'Calculadora', href: '/calculadora' },
    { label: data.direccion || project?.name || 'Proyecto' }
  ]

  // Loading state
  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: 'Calculadora', href: '/calculadora' }, { label: 'Cargando...' }]} fullWidth>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Not found
  if (notFound) {
    return (
      <DashboardLayout breadcrumbs={[{ label: 'Calculadora', href: '/calculadora' }, { label: 'No encontrado' }]} fullWidth>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Proyecto no encontrado</h1>
          <p className="text-gray-500 mb-6">El proyecto que buscas no existe o ha sido eliminado.</p>
          <a href="/calculadora" className="bg-foreground text-background px-6 py-3 rounded-lg hover:bg-foreground/90 transition-colors">
            Volver a proyectos
          </a>
        </div>
      </DashboardLayout>
    )
  }

  const projectTitle = data.direccion || project?.name || 'Proyecto'

  // Preparar datos para componentes
  const propertyDetailsData = {
    ciudad: data.ciudad,
    direccion: data.direccion,
    planta: data.planta,
    m2Construidos: data.m2Construidos,
    m2ZZCC: data.m2ZZCC,
    m2Totales: calculations.m2Totales,
    terrazaM2: data.terrazaM2,
    exterior: data.exterior === 'Exterior',
    ascensor: data.ascensor,
    portero: data.portero,
    ite: data.ite,
    garaje: data.garaje
  }

  const compraData = {
    precio: data.precioCompra,
    fecha: data.fechaCompra,
    intermediacion: data.intermediacionCompra,
    porcentajeIntermediacion: data.porcentajeIntermediacionCompra,
    m2Totales: calculations.m2Totales
  }

  const ventaData = {
    precio: data.precioVenta,
    fecha: data.fechaVenta,
    intermediacion: data.intermediacionVenta,
    porcentajeIntermediacion: data.porcentajeIntermediacionVenta,
    m2Totales: calculations.m2Totales
  }

  const renovationData = {
    calidad: data.calidad,
    habitaciones: data.habitaciones,
    banos: data.banos,
    hardCosts: {
      obra: calculations.obra,
      materiales: calculations.calidadCoste,
      interiorismo: calculations.interiorismo,
      mobiliario: calculations.mobiliario,
      terraza: calculations.terrazaCost,
      toldo: calculations.toldoCost,
      extras: calculations.extras,
      total: calculations.hardCosts
    },
    softCosts: {
      arquitectura: calculations.arquitectura,
      permisoConstruccion: calculations.permisoConstruccion,
      gastosVenta: calculations.gastosVenta,
      costosTenencia: calculations.costosTenencia,
      plusvalia: calculations.plusvalia,
      total: calculations.softCosts
    },
    totalGastos: calculations.totalGastos
  }

  const plData = {
    adquisicion: {
      compraPiso: data.precioCompra,
      honorarioCompra: calculations.honorarioCompra,
      inscripcionEscritura: calculations.inscripcionEscritura,
      itp: calculations.itp,
      total: calculations.totalAdquisicion
    },
    inversionReforma: {
      hardCosts: calculations.hardCosts,
      softCosts: calculations.softCosts,
      intereses: calculations.interesProyecto,
      total: calculations.totalGastos + calculations.interesProyecto
    },
    resultadoVenta: {
      precioVenta: data.precioVenta,
      honorariosVenta: calculations.honorariosVenta,
      ventaNeta: calculations.ventaNeta,
      inversionTotal: calculations.inversionTotal,
      beneficioNeto: calculations.beneficioNeto
    }
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} fullWidth>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <ProjectHeader
            title={projectTitle}
            versionNumber={activeVersionData?.version_number}
            onSave={() => handleSaveVersion()}
            onShare={copyShareUrl}
            onPrint={() => window.print()}
            onVersionHistory={() => setShowVersionModal(true)}
            hasChanges={hasChanges}
            saving={saving}
          />

          {/* Toggle Edit/View Mode */}
          <div className="flex items-center justify-end gap-2 no-print">
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="gap-1.5"
            >
              {isEditMode ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Ver modo lectura
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar datos
                </>
              )}
            </Button>
          </div>

          {/* Key Metrics Panel */}
          <KeyMetrics
            precioCompra={data.precioCompra}
            precioVenta={data.precioVenta}
            inversionTotal={calculations.inversionTotal}
            roi={calculations.roi}
            margen={calculations.margen}
            tir={calculations.tir}
            beneficioNeto={calculations.beneficioNeto}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Property & Transactions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Details */}
              {isEditMode ? (
                <EditablePropertyDetails data={data} updateField={updateField} boolOptions={boolOptions} calculations={calculations} />
              ) : (
                <PropertyDetails {...propertyDetailsData} />
              )}

              {/* Transaction Cards */}
              {isEditMode ? (
                <EditableTransactions data={data} updateField={updateField} calculations={calculations} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TransactionCard type="compra" {...compraData} />
                  <TransactionCard type="venta" {...ventaData} />
                </div>
              )}

              {/* Renovation Module */}
              {isEditMode ? (
                <EditableRenovation data={data} updateField={updateField} calculations={calculations} boolOptions={boolOptions} />
              ) : (
                <RenovationModule {...renovationData} />
              )}

              {/* Financing Section (only in edit mode) */}
              {isEditMode && (
                <EditableFinancing data={data} updateField={updateField} calculations={calculations} />
              )}

              {/* Sensitivity Matrix */}
              <SensitivityMatrix
                precioCompra={data.precioCompra}
                precioVenta={data.precioVenta}
                inversionTotal={calculations.inversionTotal}
                beneficioNeto={calculations.beneficioNeto}
                margen={calculations.margen}
              />
            </div>

            {/* Right Column - P&L Summary */}
            <div className="space-y-6">
              <ProfitLossSummary {...plData} />

              {/* Metrics per m2 */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Métricas por m²</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Compra</span>
                    <span className="font-medium">{formatCurrency(data.precioCompra / calculations.m2Totales)}/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inversión Total</span>
                    <span className="font-medium">{formatCurrency(calculations.euroM2Inversion)}/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venta</span>
                    <span className="font-medium">{formatCurrency(calculations.euroM2Venta)}/m²</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Beneficio</span>
                    <span className={`font-semibold ${calculations.beneficioNeto >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatCurrency(calculations.beneficioNeto / calculations.m2Totales)}/m²
                    </span>
                  </div>
                </div>
              </div>

              {/* Financing Summary */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Financiación</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deuda</span>
                    <span className="font-medium">{formatCurrency(data.deuda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interés</span>
                    <span className="font-medium">{data.interesFinanciero}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interés Proyecto</span>
                    <span className="font-medium">{formatCurrency(calculations.interesProyecto)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Equity Necesario</span>
                    <span className="font-semibold">{formatCurrency(calculations.equityNecesario)}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración</span>
                    <span className="font-medium">{calculations.mesesProyecto.toFixed(1)} meses</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TIR Anualizada</span>
                    <span className={`font-semibold ${calculations.tir >= 30 ? "text-emerald-600" : calculations.tir >= 20 ? "text-amber-600" : "text-rose-600"}`}>
                      {formatPercent(calculations.tir)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
              Comentarios del Proyecto
            </h3>

            <div className="space-y-4 mb-6">
              {(!data.comentarios || data.comentarios.length === 0) ? (
                <div className="text-muted-foreground text-sm text-center py-4">No hay comentarios todavía</div>
              ) : (
                data.comentarios.map((comentario) => (
                  <div key={comentario.id} className="bg-muted/50 rounded-lg p-4 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center font-semibold text-sm">
                          {comentario.autor.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{comentario.autor}</div>
                          <div className="text-xs text-muted-foreground">{comentario.fecha}</div>
                        </div>
                      </div>
                      <button onClick={() => eliminarComentario(comentario.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-all p-1" title="Eliminar comentario">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                    <p className="text-foreground/80 text-sm ml-10">{comentario.texto}</p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarComentario()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-background"
                />
                <Button
                  onClick={agregarComentario}
                  disabled={!nuevoComentario.trim()}
                  size="sm"
                >
                  Añadir
                </Button>
              </div>
            </div>
          </div>

          {/* Version Tabs (collapsed) */}
          {versions.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 no-print">
              <h3 className="text-sm font-semibold text-foreground mb-3">Versiones guardadas</h3>
              <div className="flex flex-wrap gap-2">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => handleSelectVersion(version)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      activeVersionData?.id === version.id
                        ? "bg-foreground text-background"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {version.version_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal guardar version */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-2xl p-6 w-96 max-w-[90vw] border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Guardar versión</h3>
            <form onSubmit={handleSaveVersion}>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-1 block">Nombre de la versión</label>
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="Ej: Escenario optimista, Base case..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowVersionModal(false); setNewVersionName(""); }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !newVersionName.trim()}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// Editable Components
function EditablePropertyDetails({ data, updateField, boolOptions, calculations }: any) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
        Datos del Inmueble
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Ciudad" value={data.ciudad} onChange={(v: string) => updateField('ciudad', v)} options={[{ value: "Madrid", label: "Madrid" }, { value: "Barcelona", label: "Barcelona" }, { value: "Malaga", label: "Málaga" }]} />
        <InputField label="Dirección" value={data.direccion} onChange={(v: string) => updateField('direccion', v)} className="col-span-2" />
        <InputField label="Planta" value={data.planta} onChange={(v: string) => updateField('planta', v)} />
        <NumberField label="M² Construidos" value={data.m2Construidos} onChange={(v: number) => updateField('m2Construidos', v)} suffix="m²" />
        <NumberField label="M² ZZCC" value={data.m2ZZCC} onChange={(v: number) => updateField('m2ZZCC', v)} suffix="m²" />
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">M² Totales</label>
          <div className="px-3 py-2 bg-muted rounded-lg text-foreground font-medium">{calculations.m2Totales} m²</div>
        </div>
        <NumberField label="M² Terraza" value={data.terrazaM2} onChange={(v: number) => updateField('terrazaM2', v)} suffix="m²" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <InputField label="Exterior/Interior" value={data.exterior} onChange={(v: string) => updateField('exterior', v)} options={[{ value: "Exterior", label: "Exterior" }, { value: "Interior", label: "Interior" }]} />
        <InputField label="Ascensor" value={String(data.ascensor)} onChange={(v: string) => updateField('ascensor', v === "true")} options={boolOptions} />
        <InputField label="Portero" value={String(data.portero)} onChange={(v: string) => updateField('portero', v === "true")} options={boolOptions} />
        <InputField label="ITE" value={String(data.ite)} onChange={(v: string) => updateField('ite', v === "true")} options={boolOptions} />
        <InputField label="Garaje" value={String(data.garaje)} onChange={(v: string) => updateField('garaje', v === "true")} options={boolOptions} />
        <InputField label="Toldo/Pérgola" value={String(data.toldoPergola)} onChange={(v: string) => updateField('toldoPergola', v === "true")} options={boolOptions} />
      </div>
    </div>
  )
}

function EditableTransactions({ data, updateField, calculations }: any) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
        Compra y Venta
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Compra</h4>
          <CurrencyInput label="Precio de Compra" value={data.precioCompra} onChange={(v: number) => updateField('precioCompra', v)} />
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">Fecha de Compra</label>
            <input type="date" value={data.fechaCompra} onChange={(e) => updateField('fechaCompra', e.target.value)} className="font-medium px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background" />
          </div>
          <div className="flex gap-4">
            <InputField label="Intermediación" value={String(data.intermediacionCompra)} onChange={(v: string) => updateField('intermediacionCompra', v === "true")} options={[{ value: "false", label: "No" }, { value: "true", label: "Sí" }]} className="flex-1" />
            {data.intermediacionCompra && <NumberField label="%" value={data.porcentajeIntermediacionCompra} onChange={(v: number) => updateField('porcentajeIntermediacionCompra', v)} suffix="%" className="w-24" />}
          </div>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">€/m²: <span className="font-medium">{formatCurrency(data.precioCompra / calculations.m2Totales)}</span></div>
        </div>
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Venta</h4>
          <CurrencyInput label="Precio de Venta" value={data.precioVenta} onChange={(v: number) => updateField('precioVenta', v)} />
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">Fecha de Venta (prevista)</label>
            <input type="date" value={data.fechaVenta} onChange={(e) => updateField('fechaVenta', e.target.value)} className="font-medium px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background" />
          </div>
          <div className="flex gap-4">
            <InputField label="Intermediación" value={String(data.intermediacionVenta)} onChange={(v: string) => updateField('intermediacionVenta', v === "true")} options={[{ value: "false", label: "No" }, { value: "true", label: "Sí" }]} className="flex-1" />
            {data.intermediacionVenta && <NumberField label="%" value={data.porcentajeIntermediacionVenta} onChange={(v: number) => updateField('porcentajeIntermediacionVenta', v)} suffix="%" className="w-24" />}
          </div>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">€/m²: <span className="font-medium">{formatCurrency(data.precioVenta / calculations.m2Totales)}</span></div>
        </div>
      </div>
    </div>
  )
}

function EditableRenovation({ data, updateField, calculations, boolOptions }: any) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
        Reforma
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Calidad" value={String(data.calidad)} onChange={(v: string) => updateField('calidad', parseInt(v))} options={[{ value: "1", label: "★ 1 Estrella" }, { value: "2", label: "★★ 2 Estrellas" }, { value: "3", label: "★★★ 3 Estrellas" }, { value: "4", label: "★★★★ 4 Estrellas" }, { value: "5", label: "★★★★★ 5 Estrellas" }]} />
        <NumberField label="Habitaciones" value={data.habitaciones} onChange={(v: number) => updateField('habitaciones', v)} />
        <NumberField label="Baños" value={data.banos} onChange={(v: number) => updateField('banos', v)} />
        <NumberField label="Ventanas" value={data.ventanas} onChange={(v: number) => updateField('ventanas', v)} />
        <InputField label="Estilo Clásico" value={String(data.esClasico)} onChange={(v: string) => updateField('esClasico', v === "true")} options={boolOptions} />
        <InputField label="Calefacción" value={data.calefaccion} onChange={(v: string) => updateField('calefaccion', v)} options={[{ value: "CENTRAL", label: "Central" }, { value: "INDIVIDUAL", label: "Individual" }, { value: "NO", label: "Sin calefacción" }]} />
        <InputField label="Climatización" value={data.climatizacion} onChange={(v: string) => updateField('climatizacion', v)} options={[{ value: "CONDUCTOS", label: "Conductos" }, { value: "SPLITS", label: "Splits" }, { value: "NO", label: "Sin A/C" }]} />
        <CurrencyInput label="Extras" value={data.extras} onChange={(v: number) => updateField('extras', v)} />
      </div>
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Hard Costs:</span>
            <span className="font-medium ml-2">{formatCurrency(calculations.hardCosts)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Soft Costs:</span>
            <span className="font-medium ml-2">{formatCurrency(calculations.softCosts)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Total Gastos:</span>
            <span className="font-semibold ml-2">{formatCurrency(calculations.totalGastos)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditableFinancing({ data, updateField, calculations }: any) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
        Financiación
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CurrencyInput label="Deuda" value={data.deuda} onChange={(v: number) => updateField('deuda', v)} />
        <NumberField label="Interés Financiero" value={data.interesFinanciero} onChange={(v: number) => updateField('interesFinanciero', v)} suffix="%" step="0.01" />
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">Interés Proyecto</label>
          <div className="px-3 py-2 bg-muted rounded-lg text-foreground font-medium">{formatCurrency(calculations.interesProyecto)}</div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">Equity Necesario</label>
          <div className="px-3 py-2 bg-muted rounded-lg text-foreground font-medium">{formatCurrency(calculations.equityNecesario)}</div>
        </div>
      </div>
    </div>
  )
}

// Form Components
function CurrencyInput({ label, value, onChange, className = '' }: { label: string; value: number; onChange: (v: number) => void; className?: string }) {
  const [isFocused, setIsFocused] = useState(false)
  const [rawInput, setRawInput] = useState(String(value))

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    setRawInput(String(value))
    setTimeout(() => e.target.select(), 0)
  }

  const handleBlur = () => {
    setIsFocused(false)
    const numValue = parseInt(rawInput.replace(/[^\d]/g, '')) || 0
    onChange(numValue)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
    setRawInput(inputVal)
    const numValue = parseInt(inputVal.replace(/[^\d]/g, '')) || 0
    onChange(numValue)
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={isFocused ? rawInput : formatNumberInput(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="font-medium w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring pr-12 bg-background"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, options, className = '' }: { label: string; value: string; onChange: (v: string) => void; options?: { value: string; label: string }[]; className?: string }) {
  if (options) {
    return (
      <div className={`flex flex-col ${className}`}>
        <label className="text-xs text-muted-foreground mb-1">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="font-medium px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          {options.map(opt => (<option key={String(opt.value)} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
    )
  }
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="font-medium w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background" />
    </div>
  )
}

function NumberField({ label, value, onChange, suffix = '', className = '', step = '1' }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; className?: string; step?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="font-medium w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{suffix}</span>}
      </div>
    </div>
  )
}
