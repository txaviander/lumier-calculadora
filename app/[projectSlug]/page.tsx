'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
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
  const totalAdquisicion = params.precioCompra + honorarioCompra + 1530 + params.precioCompra * 0.02
  const costeObraBase: Record<number, number> = { 1: 350, 2: 420, 3: 560, 4: 700, 5: 900 }
  const obra = params.m2Construidos * (costeObraBase[qualityLevel] || 560)
  const costeCalidadBase: Record<number, number> = { 1: 300, 2: 400, 3: 512, 4: 650, 5: 850 }
  const calidadCoste = params.m2Construidos * (costeCalidadBase[qualityLevel] || 512)
  const costeInteriorismoBase: Record<number, number> = { 1: 40, 2: 50, 3: 59.1, 4: 75, 5: 95 }
  const interiorismo = params.m2Construidos * (costeInteriorismoBase[qualityLevel] || 59.1) + (params.esClasico ? 790 : 0)
  const costeMobiliarioBase: Record<number, number> = { 1: 60, 2: 80, 3: 101.7, 4: 130, 5: 170 }
  const mobiliario = params.m2Construidos * (costeMobiliarioBase[qualityLevel] || 101.7)
  const terrazaCost = params.terrazaM2 > 0 ? params.terrazaM2 * 36.5 : 0
  const toldoCost = params.toldoPergola ? 2500 : 0
  const hardCosts = obra + calidadCoste + interiorismo + mobiliario + terrazaCost + toldoCost
  const arquitecturaFija: Record<number, number> = { 1: 3630, 2: 3630, 3: 6050, 4: 12100, 5: 18150 }
  const arquitectura = arquitecturaFija[qualityLevel] || 6050
  const softCosts = arquitectura + params.m2Construidos * 34.2 + 800 + 2490
  const totalGastos = hardCosts + softCosts
  const interesProyecto = params.deuda * (params.interesFinanciero / 100) / 2
  const inversionBase = totalAdquisicion + totalGastos + interesProyecto
  return { qualityLevel, obra, calidadCoste, interiorismo, mobiliario, hardCosts, softCosts, totalGastos, inversionBase, totalAdquisicion, interesProyecto }
}

const calculateRequiredSalePrice = (inversionBase: number, targetMargin: number, intermediacionVenta: boolean, porcentajeIntermediacionVenta: number) => {
  const comisionConIva = intermediacionVenta ? (porcentajeIntermediacionVenta / 100) * 1.21 : 0
  return inversionBase / (1 - comisionConIva - 0.0027 - targetMargin / 100)
}

const calculateBenefitForQuality = (qualityLevel: number, params: any, precioVenta: number) => {
  const calc = calculateForQuality(qualityLevel, params)
  const honorariosVentaBase = params.intermediacionVenta ? precioVenta * (params.porcentajeIntermediacionVenta / 100) : 0
  const honorariosVenta = honorariosVentaBase * 1.21
  const plusvalia = precioVenta * 0.0027
  const ventaNeta = precioVenta - honorariosVenta
  const inversionTotal = calc.inversionBase + plusvalia
  return ventaNeta - inversionTotal
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
  const [showVersionSelector, setShowVersionSelector] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [nuevoComentario, setNuevoComentario] = useState('')

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
          // Merge con defaults para campos que puedan faltar
          setData({ ...defaultCalculatorData, ...activeVersion.data })
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
      setData({ ...defaultCalculatorData, ...version.data })
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

  // Parametros de calculo
  const calcParams = useMemo(() => ({
    m2Construidos: data.m2Construidos,
    m2ZZCC: data.m2ZZCC,
    precioCompra: data.precioCompra,
    intermediacionCompra: data.intermediacionCompra,
    porcentajeIntermediacionCompra: data.porcentajeIntermediacionCompra,
    intermediacionVenta: data.intermediacionVenta,
    porcentajeIntermediacionVenta: data.porcentajeIntermediacionVenta,
    esClasico: data.esClasico,
    terrazaM2: data.terrazaM2,
    toldoPergola: data.toldoPergola,
    deuda: data.deuda,
    interesFinanciero: data.interesFinanciero
  }), [data.m2Construidos, data.m2ZZCC, data.precioCompra, data.intermediacionCompra, data.porcentajeIntermediacionCompra,
      data.intermediacionVenta, data.porcentajeIntermediacionVenta, data.esClasico, data.terrazaM2, data.toldoPergola, data.deuda, data.interesFinanciero])

  // Calculos principales
  const calculations = useMemo(() => {
    const m2Totales = data.m2Construidos + data.m2ZZCC
    const honorarioCompraBase = data.intermediacionCompra ? data.precioCompra * (data.porcentajeIntermediacionCompra / 100) : 0
    const ivaHonorarioCompra = honorarioCompraBase * 0.21
    const honorarioCompra = honorarioCompraBase + ivaHonorarioCompra
    const inscripcionEscritura = 1530
    const itp = data.precioCompra * 0.02
    const totalAdquisicion = data.precioCompra + honorarioCompra + inscripcionEscritura + itp

    const costeObraBase: Record<number, number> = { 1: 350, 2: 420, 3: 560, 4: 700, 5: 900 }
    const obra = data.m2Construidos * (costeObraBase[data.calidad] || 560)
    const costeCalidadBase: Record<number, number> = { 1: 300, 2: 400, 3: 512, 4: 650, 5: 850 }
    const calidadCoste = data.m2Construidos * (costeCalidadBase[data.calidad] || 512)
    const costeInteriorismoBase: Record<number, number> = { 1: 40, 2: 50, 3: 59.1, 4: 75, 5: 95 }
    const interiorismo = data.m2Construidos * (costeInteriorismoBase[data.calidad] || 59.1) + (data.esClasico ? 790 : 0)
    const costeMobiliarioBase: Record<number, number> = { 1: 60, 2: 80, 3: 101.7, 4: 130, 5: 170 }
    const mobiliario = data.m2Construidos * (costeMobiliarioBase[data.calidad] || 101.7)
    const terrazaCost = data.terrazaM2 > 0 ? data.terrazaM2 * 36.5 : 0
    const toldoCost = data.toldoPergola ? 2500 : 0
    const hardCosts = obra + calidadCoste + interiorismo + mobiliario + terrazaCost + toldoCost + data.extras

    const arquitecturaFija: Record<number, number> = { 1: 3630, 2: 3630, 3: 6050, 4: 12100, 5: 18150 }
    const arquitectura = arquitecturaFija[data.calidad] || 6050
    const permisoConstruccion = data.m2Construidos * 34.2
    const gastosVenta = 800
    const costosTenencia = 2490
    const plusvalia = data.precioVenta * 0.0027
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
      beneficioNeto, roi, margen, euroM2Inversion, euroM2Venta, tir, mesesProyecto, diasProyecto
    }
  }, [data])

  const boolOptions = [{ value: "true", label: "Si" }, { value: "false", label: "No" }]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

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

  const projectTitle = `Analisis Proyecto: ${data.direccion || project?.name} - ${data.planta}`

  return (
    <div className="min-h-screen pb-12">
      {/* Header sticky con metricas */}
      <div className="bg-lumier-black text-white py-4 px-8 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">{projectTitle}</h1>
              <div className="text-sm opacity-80">{data.ciudad} | {calculations.m2Totales} m2 totales</div>
            </div>
            <svg viewBox="0 0 280 60" className="h-12" style={{width: 'auto'}}>
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: '#d4af37'}} />
                  <stop offset="50%" style={{stopColor: '#f4e4bc'}} />
                  <stop offset="100%" style={{stopColor: '#d4af37'}} />
                </linearGradient>
              </defs>
              <text x="140" y="32" textAnchor="middle" fill="white" style={{fontFamily: "'Playfair Display', Georgia, serif", fontSize: '32px', fontWeight: 600, letterSpacing: '0.2em'}}>LUMIER</text>
              <line x1="40" y1="42" x2="120" y2="42" stroke="url(#goldGradient)" strokeWidth="1" />
              <line x1="160" y1="42" x2="240" y2="42" stroke="url(#goldGradient)" strokeWidth="1" />
              <text x="140" y="54" textAnchor="middle" fill="white" style={{fontFamily: "'Inter', sans-serif", fontSize: '9px', fontWeight: 300, letterSpacing: '0.35em', opacity: 0.9}}>CASAS BOUTIQUE</text>
            </svg>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 pt-3 border-t border-white border-opacity-30">
            <div>
              <div className="text-xs opacity-70">Precio Compra</div>
              <div className="font-semibold">{formatCurrency(data.precioCompra)}</div>
              <div className="text-xs opacity-70">{formatCurrency(data.precioCompra / calculations.m2Totales)}/m2</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Precio Venta</div>
              <div className="font-semibold">{formatCurrency(data.precioVenta)}</div>
              <div className="text-xs opacity-70">{formatCurrency(data.precioVenta / calculations.m2Totales)}/m2</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Inversion Total</div>
              <div className="font-semibold">{formatCurrency(calculations.inversionTotal)}</div>
              <div className="text-xs opacity-70">{formatCurrency(calculations.euroM2Inversion)}/m2</div>
            </div>
            <div>
              <div className="text-xs opacity-70">ROI</div>
              <div className="text-2xl font-bold">{formatPercent(calculations.roi)}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Margen</div>
              <div className="text-2xl font-bold">{formatPercent(calculations.margen)}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">TIR Anual</div>
              <div className={`text-2xl font-bold ${calculations.tir >= 30 ? "text-green-400" : calculations.tir >= 20 ? "text-yellow-400" : "text-red-400"}`}>{formatPercent(calculations.tir)}</div>
              <div className="text-xs opacity-70">{calculations.mesesProyecto.toFixed(1)} meses ({calculations.diasProyecto} dias)</div>
            </div>
            <div className={`rounded-lg p-2 -my-1 ${calculations.margen >= 16 ? "bg-green-600" : calculations.margen >= 13 ? "bg-orange-500" : "bg-red-600"}`}>
              <div className="text-xs opacity-90">Beneficio Neto</div>
              <div className="text-2xl font-extrabold">{formatCurrency(calculations.beneficioNeto)}</div>
              <div className="text-xs font-semibold">{calculations.margen >= 16 ? "OPORTUNIDAD" : calculations.margen >= 13 ? "AJUSTADO" : "NO HACER"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Versiones */}
      <div className="bg-gray-100 border-b border-gray-200 sticky top-[140px] z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2 overflow-x-auto">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => handleSelectVersion(version)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all min-w-max ${
                  activeVersionData?.id === version.id
                    ? "bg-white border-t-2 border-blue-500 shadow-sm"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <span className="text-sm font-medium text-gray-700">{version.version_name}</span>
              </button>
            ))}

            {!activeVersionData && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-t-lg bg-white border-t-2 border-orange-500 shadow-sm min-w-max">
                <span className="text-sm font-medium text-orange-600">Sin guardar</span>
              </div>
            )}

            <button
              onClick={() => setShowVersionModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors min-w-max"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
              Guardar version
            </button>

            <button
              onClick={copyShareUrl}
              className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors min-w-max"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartir
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors min-w-max"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              Imprimir
            </button>

            {hasChanges && (
              <span className="text-sm text-orange-600 flex items-center gap-1 ml-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Cambios sin guardar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal guardar version */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Guardar version</h3>
            <form onSubmit={handleSaveVersion}>
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-1 block">Nombre de la version</label>
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="Ej: Escenario optimista, Base case..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowVersionModal(false); setNewVersionName(""); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !newVersionName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <CollapsibleSection title="Datos del Inmueble" color="bg-blue-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputField label="Ciudad" value={data.ciudad} onChange={(v) => updateField('ciudad', v)} options={[{ value: "Madrid", label: "Madrid" }, { value: "Barcelona", label: "Barcelona" }, { value: "Malaga", label: "Malaga" }]} />
                <InputField label="Direccion" value={data.direccion} onChange={(v) => updateField('direccion', v)} className="col-span-2" />
                <InputField label="Planta" value={data.planta} onChange={(v) => updateField('planta', v)} />
                <NumberField label="M2 Construidos" value={data.m2Construidos} onChange={(v) => updateField('m2Construidos', v)} suffix="m2" />
                <NumberField label="M2 ZZCC" value={data.m2ZZCC} onChange={(v) => updateField('m2ZZCC', v)} suffix="m2" />
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">M2 Totales</label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">{calculations.m2Totales} m2</div>
                </div>
                <NumberField label="M2 Terraza" value={data.terrazaM2} onChange={(v) => updateField('terrazaM2', v)} suffix="m2" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <InputField label="Exterior/Interior" value={data.exterior} onChange={(v) => updateField('exterior', v)} options={[{ value: "Exterior", label: "Exterior" }, { value: "Interior", label: "Interior" }]} />
                <InputField label="Ascensor" value={String(data.ascensor)} onChange={(v) => updateField('ascensor', v === "true")} options={boolOptions} />
                <InputField label="Portero" value={String(data.portero)} onChange={(v) => updateField('portero', v === "true")} options={boolOptions} />
                <InputField label="ITE" value={String(data.ite)} onChange={(v) => updateField('ite', v === "true")} options={boolOptions} />
                <InputField label="Garaje" value={String(data.garaje)} onChange={(v) => updateField('garaje', v === "true")} options={boolOptions} />
                <InputField label="Toldo/Pergola" value={String(data.toldoPergola)} onChange={(v) => updateField('toldoPergola', v === "true")} options={boolOptions} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Compra y Venta" color="bg-green-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Compra</h3>
                  <CurrencyInput label="Precio de Compra" value={data.precioCompra} onChange={(v) => updateField('precioCompra', v)} />
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Fecha de Compra</label>
                    <input type="date" value={data.fechaCompra} onChange={(e) => updateField('fechaCompra', e.target.value)} className="input-blue font-medium px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-4">
                    <InputField label="Intermediacion" value={String(data.intermediacionCompra)} onChange={(v) => updateField('intermediacionCompra', v === "true")} options={[{ value: "false", label: "No" }, { value: "true", label: "Si" }]} className="flex-1" />
                    {data.intermediacionCompra && <NumberField label="%" value={data.porcentajeIntermediacionCompra} onChange={(v) => updateField('porcentajeIntermediacionCompra', v)} suffix="%" className="w-24" />}
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">EUR/m2: <span className="font-medium">{formatCurrency(data.precioCompra / calculations.m2Totales)}</span></div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Venta</h3>
                  <CurrencyInput label="Precio de Venta" value={data.precioVenta} onChange={(v) => updateField('precioVenta', v)} />
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Fecha de Venta (prevista)</label>
                    <input type="date" value={data.fechaVenta} onChange={(e) => updateField('fechaVenta', e.target.value)} className="input-blue font-medium px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-4">
                    <InputField label="Intermediacion" value={String(data.intermediacionVenta)} onChange={(v) => updateField('intermediacionVenta', v === "true")} options={[{ value: "false", label: "No" }, { value: "true", label: "Si" }]} className="flex-1" />
                    {data.intermediacionVenta && <NumberField label="%" value={data.porcentajeIntermediacionVenta} onChange={(v) => updateField('porcentajeIntermediacionVenta', v)} suffix="%" className="w-24" />}
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">EUR/m2: <span className="font-medium">{formatCurrency(data.precioVenta / calculations.m2Totales)}</span></div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Reforma" color="bg-orange-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputField label="Calidad" value={String(data.calidad)} onChange={(v) => updateField('calidad', parseInt(v))} options={[{ value: "1", label: "* 1 Estrella" }, { value: "2", label: "** 2 Estrellas" }, { value: "3", label: "*** 3 Estrellas" }, { value: "4", label: "**** 4 Estrellas" }, { value: "5", label: "***** 5 Estrellas" }]} />
                <NumberField label="Habitaciones" value={data.habitaciones} onChange={(v) => updateField('habitaciones', v)} />
                <NumberField label="Banos" value={data.banos} onChange={(v) => updateField('banos', v)} />
                <NumberField label="Ventanas" value={data.ventanas} onChange={(v) => updateField('ventanas', v)} />
                <InputField label="Estilo Clasico" value={String(data.esClasico)} onChange={(v) => updateField('esClasico', v === "true")} options={boolOptions} />
                <InputField label="Calefaccion" value={data.calefaccion} onChange={(v) => updateField('calefaccion', v)} options={[{ value: "CENTRAL", label: "Central" }, { value: "INDIVIDUAL", label: "Individual" }, { value: "NO", label: "Sin calefaccion" }]} />
                <InputField label="Climatizacion" value={data.climatizacion} onChange={(v) => updateField('climatizacion', v)} options={[{ value: "CONDUCTOS", label: "Conductos" }, { value: "SPLITS", label: "Splits" }, { value: "NO", label: "Sin A/C" }]} />
                <CurrencyInput label="Extras" value={data.extras} onChange={(v) => updateField('extras', v)} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Financiacion" color="bg-purple-500" defaultOpen={false}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CurrencyInput label="Deuda" value={data.deuda} onChange={(v) => updateField('deuda', v)} />
                <NumberField label="Interes Financiero" value={data.interesFinanciero} onChange={(v) => updateField('interesFinanciero', v)} suffix="%" step="0.01" />
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Interes Proyecto</label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">{formatCurrency(calculations.interesProyecto)}</div>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Equity Necesario</label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">{formatCurrency(calculations.equityNecesario)}</div>
                </div>
              </div>
            </CollapsibleSection>

            <SensitivityAnalysis params={calcParams} currentQuality={data.calidad} precioVenta={data.precioVenta} />
            <CostComparisonChart params={calcParams} currentQuality={data.calidad} />
          </div>

          <div className="space-y-4">
            <CollapsibleSection title="P&L Detallado" color="bg-rose-500" defaultOpen={true}>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Adquisicion</div>
                <SummaryRow label="Compra de piso" value={formatCurrency(data.precioCompra)} />
                <SummaryRow label="Honorario compra" value={formatCurrency(calculations.honorarioCompra)} indent />
                <SummaryRow label="Inscripcion escritura" value={formatCurrency(calculations.inscripcionEscritura)} indent />
                <SummaryRow label="ITP" value={formatCurrency(calculations.itp)} indent />
                <SummaryRow label="Total Adquisicion" value={formatCurrency(calculations.totalAdquisicion)} highlight />
              </div>
              <div className="border-t pt-3 mt-3 space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Gastos</div>
                <SummaryRow label="Hard Costs" value={formatCurrency(calculations.hardCosts)} />
                <SummaryRow label="Obra" value={formatCurrency(calculations.obra)} indent />
                <SummaryRow label="Calidad materiales" value={formatCurrency(calculations.calidadCoste)} indent />
                <SummaryRow label="Interiorismo" value={formatCurrency(calculations.interiorismo)} indent />
                <SummaryRow label="Mobiliario" value={formatCurrency(calculations.mobiliario)} indent />
                {calculations.extras > 0 && <SummaryRow label="Extras" value={formatCurrency(calculations.extras)} indent />}
                <SummaryRow label="Soft Costs" value={formatCurrency(calculations.softCosts)} />
                <SummaryRow label="Arquitectura" value={formatCurrency(calculations.arquitectura)} indent />
                <SummaryRow label="Permiso construccion" value={formatCurrency(calculations.permisoConstruccion)} indent />
                <SummaryRow label="Costos tenencia" value={formatCurrency(calculations.costosTenencia)} indent />
                <SummaryRow label="Plusvalia" value={formatCurrency(calculations.plusvalia)} indent />
                <SummaryRow label="Total Gastos" value={formatCurrency(calculations.totalGastos)} highlight />
              </div>
              <div className="border-t pt-3 mt-3 space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Venta</div>
                <SummaryRow label="Precio de venta" value={formatCurrency(data.precioVenta)} />
                <SummaryRow label="Honorarios venta" value={`-${formatCurrency(calculations.honorariosVenta)}`} indent />
                <SummaryRow label="Venta Neta" value={formatCurrency(calculations.ventaNeta)} highlight />
              </div>
            </CollapsibleSection>

            <div className="bg-white rounded-xl card-shadow p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Metricas por m2</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Compra</span><span className="font-medium">{formatCurrency(data.precioCompra / calculations.m2Totales)}/m2</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Inversion Total</span><span className="font-medium">{formatCurrency(calculations.euroM2Inversion)}/m2</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Venta</span><span className="font-medium">{formatCurrency(calculations.euroM2Venta)}/m2</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-gray-600">Beneficio</span><span className={`font-medium ${calculations.beneficioNeto >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(calculations.beneficioNeto / calculations.m2Totales)}/m2</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Comentarios */}
        <div className="mt-6">
          <div className="bg-white rounded-xl card-shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              Comentarios del Proyecto
            </h3>

            <div className="space-y-4 mb-6">
              {(!data.comentarios || data.comentarios.length === 0) ? (
                <div className="text-gray-400 text-sm text-center py-4">No hay comentarios todavia</div>
              ) : (
                data.comentarios.map((comentario) => (
                  <div key={comentario.id} className="bg-gray-50 rounded-lg p-4 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {comentario.autor.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{comentario.autor}</div>
                          <div className="text-xs text-gray-500">{comentario.fecha}</div>
                        </div>
                      </div>
                      <button onClick={() => eliminarComentario(comentario.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1" title="Eliminar comentario">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm ml-10">{comentario.texto}</p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarComentario()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={agregarComentario}
                  disabled={!nuevoComentario.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Anadir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentes auxiliares
function CollapsibleSection({ title, color, children, defaultOpen = true }: { title: string; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl card-shadow overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors no-print">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`}></span>
          {title}
        </h2>
        <div className={`w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 font-bold transition-transform ${isOpen ? "rotate-45" : ""}`}>+</div>
      </button>
      <div className="collapse-content" style={{maxHeight: isOpen ? '2000px' : '0', opacity: isOpen ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out'}}>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  )
}

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
      <label className="text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={isFocused ? rawInput : formatNumberInput(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="input-blue font-medium w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">EUR</span>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, options, className = '' }: { label: string; value: string; onChange: (v: string) => void; options?: { value: string; label: string }[]; className?: string }) {
  if (options) {
    return (
      <div className={`flex flex-col ${className}`}>
        <label className="text-xs text-gray-500 mb-1">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="input-blue font-medium px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {options.map(opt => (<option key={String(opt.value)} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
    )
  }
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-xs text-gray-500 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input-blue font-medium w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function NumberField({ label, value, onChange, suffix = '', className = '', step = '1' }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; className?: string; step?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="input-blue font-medium w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, highlight = false, indent = false }: { label: string; value: string; highlight?: boolean; indent?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${highlight ? "font-semibold text-base" : "text-sm"} ${indent ? "pl-4" : ""}`}>
      <span className={highlight ? "text-gray-800" : "text-gray-600"}>{label}</span>
      <span className={highlight ? "text-blue-600" : "text-gray-800"}>{value}</span>
    </div>
  )
}

function SensitivityAnalysis({ params, currentQuality, precioVenta }: { params: any; currentQuality: number; precioVenta: number }) {
  const [targetMargin, setTargetMargin] = useState(20)

  const qualityData = useMemo(() => {
    return [2, 3, 4, 5].map(q => {
      const calc = calculateForQuality(q, params)
      const requiredPriceCustom = calculateRequiredSalePrice(calc.inversionBase, targetMargin, params.intermediacionVenta, params.porcentajeIntermediacionVenta)
      const beneficioConMargenObjetivo = calculateBenefitForQuality(q, params, requiredPriceCustom)
      return {
        ...calc,
        requiredPrice15: calculateRequiredSalePrice(calc.inversionBase, 15, params.intermediacionVenta, params.porcentajeIntermediacionVenta),
        requiredPrice20: calculateRequiredSalePrice(calc.inversionBase, 20, params.intermediacionVenta, params.porcentajeIntermediacionVenta),
        beneficioEsperado: beneficioConMargenObjetivo,
      }
    })
  }, [params, targetMargin])

  return (
    <div className="bg-white rounded-xl card-shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
        Analisis de Sensibilidad: Precio de Venta por Calidad
      </h3>
      <div className="mb-4 flex items-center gap-4 no-print">
        <span className="text-sm text-gray-600">Margen objetivo:</span>
        <input type="range" min="5" max="30" value={targetMargin} onChange={(e) => setTargetMargin(parseInt(e.target.value))} className="w-32" />
        <span className="font-bold text-blue-600">{targetMargin}%</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-2">Calidad</th>
              <th className="text-right py-3 px-2">Inversion</th>
              <th className="text-right py-3 px-2">PV 15%</th>
              <th className="text-right py-3 px-2">PV 20%</th>
              <th className="text-right py-3 px-2 bg-green-50">Beneficio {targetMargin}%</th>
            </tr>
          </thead>
          <tbody>
            {qualityData.map((row) => (
              <tr key={row.qualityLevel} className={`border-b ${row.qualityLevel === currentQuality ? "bg-yellow-50 font-semibold" : ""}`}>
                <td className="py-3 px-2">{"*".repeat(row.qualityLevel)} {row.qualityLevel === currentQuality && <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">Actual</span>}</td>
                <td className="text-right py-3 px-2">{formatCurrency(row.inversionBase)}</td>
                <td className="text-right py-3 px-2">{formatCurrency(row.requiredPrice15)}</td>
                <td className="text-right py-3 px-2">{formatCurrency(row.requiredPrice20)}</td>
                <td className={`text-right py-3 px-2 bg-green-50 font-semibold ${row.beneficioEsperado >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(row.beneficioEsperado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-gray-500">* Beneficio calculado con el precio de venta necesario para alcanzar el margen objetivo del {targetMargin}%</div>
    </div>
  )
}

function CostComparisonChart({ params, currentQuality }: { params: any; currentQuality: number }) {
  const chartData = useMemo(() => [2, 3, 4, 5].map(q => ({ quality: q, ...calculateForQuality(q, params), isCurrent: q === currentQuality })), [params, currentQuality])
  const maxTotal = Math.max(...chartData.map(d => d.totalGastos))

  return (
    <div className="bg-white rounded-xl card-shadow p-6 relative">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
        Comparativa de Costes por Calidad
      </h3>
      <div className="space-y-4">
        {chartData.map(item => (
          <div key={item.quality} className={`p-3 rounded-lg ${item.isCurrent ? "bg-yellow-50 border-2 border-yellow-400" : "bg-gray-50"}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{"*".repeat(item.quality)} {item.quality} Estrellas</span>
              <span className="font-bold">{formatCurrency(item.totalGastos)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
              <div className="bg-blue-500 h-full" style={{width: (item.obra / maxTotal * 100) + "%"}} title="Obra"></div>
              <div className="bg-green-500 h-full" style={{width: (item.calidadCoste / maxTotal * 100) + "%"}} title="Materiales"></div>
              <div className="bg-yellow-500 h-full" style={{width: (item.interiorismo / maxTotal * 100) + "%"}} title="Interiorismo"></div>
              <div className="bg-purple-500 h-full" style={{width: (item.mobiliario / maxTotal * 100) + "%"}} title="Mobiliario"></div>
              <div className="bg-gray-400 h-full" style={{width: (item.softCosts / maxTotal * 100) + "%"}} title="Soft Costs"></div>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-3 text-xs">
              <div className="text-center p-1 rounded bg-blue-100">
                <div className="text-blue-600 font-semibold">Obra</div>
                <div className="text-gray-700">{formatCurrency(item.obra)}</div>
              </div>
              <div className="text-center p-1 rounded bg-green-100">
                <div className="text-green-600 font-semibold">Materiales</div>
                <div className="text-gray-700">{formatCurrency(item.calidadCoste)}</div>
              </div>
              <div className="text-center p-1 rounded bg-yellow-100">
                <div className="text-yellow-600 font-semibold">Interiorismo</div>
                <div className="text-gray-700">{formatCurrency(item.interiorismo)}</div>
              </div>
              <div className="text-center p-1 rounded bg-purple-100">
                <div className="text-purple-600 font-semibold">Mobiliario</div>
                <div className="text-gray-700">{formatCurrency(item.mobiliario)}</div>
              </div>
              <div className="text-center p-1 rounded bg-gray-200">
                <div className="text-gray-600 font-semibold">Soft Costs</div>
                <div className="text-gray-700">{formatCurrency(item.softCosts)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
