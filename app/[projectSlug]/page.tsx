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
  const costeArquitecturaBase: Record<number, number> = { 1: 25, 2: 32, 3: 38.3, 4: 48, 5: 60 }
  const arquitectura = params.m2Construidos * (costeArquitecturaBase[qualityLevel] || 38.3)
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

// Calcular precio maximo de compra para un margen objetivo
const calculateMaxPurchasePrice = (params: {
  m2Construidos: number
  precioVenta: number
  calidad: number
  intermediacionCompra: boolean
  porcentajeIntermediacionCompra: number
  intermediacionVenta: boolean
  porcentajeIntermediacionVenta: number
  esClasico: boolean
  terrazaM2: number
  toldoPergola: boolean
  deuda: number
  interesFinanciero: number
}, targetMargin: number) => {
  // Para un margen objetivo, necesitamos:
  // Beneficio = Margen * PrecioVenta
  // Beneficio = VentaNeta - InversionTotal
  // VentaNeta = PrecioVenta - HonorariosVenta
  // InversionTotal = PrecioCompra + Gastos + ...

  const precioVenta = params.precioVenta
  const comisionVentaConIva = params.intermediacionVenta ? (params.porcentajeIntermediacionVenta / 100) * 1.21 : 0
  const honorariosVenta = precioVenta * comisionVentaConIva
  const ventaNeta = precioVenta - honorariosVenta
  const plusvalia = precioVenta * 0.0027

  // Beneficio necesario para el margen
  const beneficioNecesario = precioVenta * (targetMargin / 100)

  // Inversion maxima permitida
  const inversionMaxima = ventaNeta - beneficioNecesario

  // Costes fijos (no dependen del precio de compra)
  const costeObraBase: Record<number, number> = { 1: 350, 2: 420, 3: 560, 4: 700, 5: 900 }
  const obra = params.m2Construidos * (costeObraBase[params.calidad] || 560)
  const costeCalidadBase: Record<number, number> = { 1: 300, 2: 400, 3: 512, 4: 650, 5: 850 }
  const calidadCoste = params.m2Construidos * (costeCalidadBase[params.calidad] || 512)
  const costeInteriorismoBase: Record<number, number> = { 1: 40, 2: 50, 3: 59.1, 4: 75, 5: 95 }
  const interiorismo = params.m2Construidos * (costeInteriorismoBase[params.calidad] || 59.1) + (params.esClasico ? 790 : 0)
  const costeMobiliarioBase: Record<number, number> = { 1: 60, 2: 80, 3: 101.7, 4: 130, 5: 170 }
  const mobiliario = params.m2Construidos * (costeMobiliarioBase[params.calidad] || 101.7)
  const terrazaCost = params.terrazaM2 > 0 ? params.terrazaM2 * 36.5 : 0
  const toldoCost = params.toldoPergola ? 2500 : 0
  const hardCosts = obra + calidadCoste + interiorismo + mobiliario + terrazaCost + toldoCost

  const costeArquitecturaBase: Record<number, number> = { 1: 25, 2: 32, 3: 38.3, 4: 48, 5: 60 }
  const arquitectura = params.m2Construidos * (costeArquitecturaBase[params.calidad] || 38.3)
  const permisoConstruccion = params.m2Construidos * 34.2
  const gastosVenta = 800
  const costosTenencia = 2490
  const softCosts = arquitectura + permisoConstruccion + gastosVenta + costosTenencia + plusvalia
  const totalGastos = hardCosts + softCosts

  const interesProyecto = params.deuda * (params.interesFinanciero / 100) / 2

  // InversionTotal = PrecioCompra * (1 + comisionCompra + ITP) + inscripcion + gastos + intereses
  // PrecioCompra * (1 + factores) = InversionMaxima - gastosNoCompra
  const comisionCompraConIva = params.intermediacionCompra ? (params.porcentajeIntermediacionCompra / 100) * 1.21 : 0
  const factorITP = 0.02
  const inscripcion = 1530

  const gastosNoCompra = inscripcion + totalGastos + interesProyecto
  const factorCompra = 1 + comisionCompraConIva + factorITP

  const precioCompraMaximo = (inversionMaxima - gastosNoCompra) / factorCompra

  return Math.max(0, precioCompraMaximo)
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [precioVentaSugerido, setPrecioVentaSugerido] = useState(false)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)

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
          const mergedData = { ...defaultCalculatorData, ...activeVersion.data }
          // Auto-rellenar direccion con nombre del proyecto si esta vacia
          if (!mergedData.direccion && projectData.name) {
            mergedData.direccion = projectData.name
          }
          setData(mergedData)
        } else {
          // Si no hay version activa, auto-rellenar direccion con nombre del proyecto
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
    setData(prev => {
      const newData = { ...prev, [field]: value }

      // Auto-rellenar direccion con titulo del proyecto cuando se cambia el nombre
      // (esto aplica cuando se crea un proyecto nuevo)

      // Sugerir precio de venta automaticamente cuando cambia precio de compra
      if (field === 'precioCompra' && typeof value === 'number' && value > 0) {
        const sugerido = Math.round(value * 1.6 / 1000) * 1000 // +60% redondeado a miles
        if (!prev.precioVenta || prev.precioVenta === 0 || precioVentaSugerido) {
          newData.precioVenta = sugerido
          setPrecioVentaSugerido(true)
        }
      }

      // Cuando el usuario edita manualmente el precio de venta, desactivar sugerencia
      if (field === 'precioVenta') {
        setPrecioVentaSugerido(false)
      }

      return newData
    })
    setHasChanges(true)
  }, [precioVentaSugerido])

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
    const m2Totales = Math.max(1, (data.m2Construidos || 0) + (data.m2ZZCC || 0))
    const precioCompra = data.precioCompra || 0
    const precioVenta = data.precioVenta || 0
    const m2Construidos = data.m2Construidos || 0
    const terrazaM2 = data.terrazaM2 || 0
    const deuda = data.deuda || 0
    const interesFinanciero = data.interesFinanciero || 0
    const porcentajeIntermediacionCompra = data.porcentajeIntermediacionCompra || 0
    const porcentajeIntermediacionVenta = data.porcentajeIntermediacionVenta || 0
    const calidad = data.calidad || 3

    const honorarioCompraBase = data.intermediacionCompra ? precioCompra * (porcentajeIntermediacionCompra / 100) : 0
    const ivaHonorarioCompra = honorarioCompraBase * 0.21
    const honorarioCompra = honorarioCompraBase + ivaHonorarioCompra
    const inscripcionEscritura = 1530
    const itp = precioCompra * 0.02
    const totalAdquisicion = precioCompra + honorarioCompra + inscripcionEscritura + itp

    const costeObraBase: Record<number, number> = { 1: 350, 2: 420, 3: 560, 4: 700, 5: 900 }
    const obra = m2Construidos * (costeObraBase[calidad] || 560)
    const costeCalidadBase: Record<number, number> = { 1: 300, 2: 400, 3: 512, 4: 650, 5: 850 }
    const calidadCoste = m2Construidos * (costeCalidadBase[calidad] || 512)
    const costeInteriorismoBase: Record<number, number> = { 1: 40, 2: 50, 3: 59.1, 4: 75, 5: 95 }
    const interiorismo = m2Construidos * (costeInteriorismoBase[calidad] || 59.1) + (data.esClasico ? 790 : 0)
    const costeMobiliarioBase: Record<number, number> = { 1: 60, 2: 80, 3: 101.7, 4: 130, 5: 170 }
    const mobiliario = m2Construidos * (costeMobiliarioBase[calidad] || 101.7)
    const terrazaCost = terrazaM2 > 0 ? terrazaM2 * 36.5 : 0
    const toldoCost = data.toldoPergola ? 2500 : 0
    const hardCosts = obra + calidadCoste + interiorismo + mobiliario + terrazaCost + toldoCost + (data.extras || 0)

    const costeArquitecturaBase: Record<number, number> = { 1: 25, 2: 32, 3: 38.3, 4: 48, 5: 60 }
    const arquitectura = m2Construidos * (costeArquitecturaBase[calidad] || 38.3)
    const permisoConstruccion = m2Construidos * 34.2
    const gastosVenta = 800
    const costosTenencia = 2490
    const plusvalia = precioVenta * 0.0027
    const softCosts = arquitectura + permisoConstruccion + gastosVenta + costosTenencia + plusvalia
    const totalGastos = hardCosts + softCosts

    const honorariosVentaBase = data.intermediacionVenta ? precioVenta * (porcentajeIntermediacionVenta / 100) : 0
    const ivaHonorarioVenta = honorariosVentaBase * 0.21
    const honorariosVenta = honorariosVentaBase + ivaHonorarioVenta
    const ventaNeta = precioVenta - honorariosVenta
    const interesProyecto = deuda * (interesFinanciero / 100) / 2
    const equityNecesario = totalAdquisicion + totalGastos - deuda
    const inversionTotal = totalAdquisicion + totalGastos + interesProyecto
    const beneficioNeto = ventaNeta - inversionTotal
    const roi = inversionTotal > 0 ? (beneficioNeto / inversionTotal) * 100 : 0
    const margen = precioVenta > 0 ? (beneficioNeto / precioVenta) * 100 : 0
    const euroM2Inversion = inversionTotal / m2Totales
    const euroM2Venta = precioVenta / m2Totales

    // Calculo de TIR
    const fechaCompraDate = new Date(data.fechaCompra || new Date())
    const fechaVentaDate = new Date(data.fechaVenta || new Date())
    const diffTime = fechaVentaDate.getTime() - fechaCompraDate.getTime()
    const diasProyecto = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    const mesesProyecto = diasProyecto / 30.44
    const tirRaw = inversionTotal > 0 && ventaNeta > 0 ? (Math.pow(ventaNeta / inversionTotal, 12 / mesesProyecto) - 1) * 100 : 0
    const tir = isNaN(tirRaw) || !isFinite(tirRaw) ? 0 : tirRaw

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

  // Calcular precio maximo de compra para 13% de margen
  const precioCompraMaximo13 = useMemo(() => {
    return calculateMaxPurchasePrice({
      m2Construidos: data.m2Construidos,
      precioVenta: data.precioVenta,
      calidad: data.calidad,
      intermediacionCompra: data.intermediacionCompra,
      porcentajeIntermediacionCompra: data.porcentajeIntermediacionCompra,
      intermediacionVenta: data.intermediacionVenta,
      porcentajeIntermediacionVenta: data.porcentajeIntermediacionVenta,
      esClasico: data.esClasico,
      terrazaM2: data.terrazaM2,
      toldoPergola: data.toldoPergola,
      deuda: data.deuda,
      interesFinanciero: data.interesFinanciero
    }, 13)
  }, [data])

  return (
    <div className="min-h-screen pb-12">
      {/* Header sticky con metricas - colapsable en mobile */}
      <div className="bg-lumier-black text-white sticky top-0 z-50 no-print">
        {/* Barra superior con boton volver y colapsar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white border-opacity-20">
          <a href="/" className="flex items-center gap-2 text-white hover:text-lumier-gold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">Volver a proyectos</span>
          </a>
          <button
            onClick={() => setHeaderCollapsed(!headerCollapsed)}
            className="lg:hidden flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 rounded bg-white/10"
          >
            <svg className={`w-4 h-4 transition-transform ${headerCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
            {headerCollapsed ? 'Expandir' : 'Colapsar'}
          </button>
          <svg viewBox="0 0 280 60" className="h-8 hidden sm:block" style={{width: 'auto'}}>
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: '#d4af37'}} />
                <stop offset="50%" style={{stopColor: '#f4e4bc'}} />
                <stop offset="100%" style={{stopColor: '#d4af37'}} />
              </linearGradient>
            </defs>
            <text x="140" y="28" textAnchor="middle" fill="white" style={{fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 600, letterSpacing: '0.2em'}}>LUMIER</text>
            <text x="140" y="45" textAnchor="middle" fill="white" style={{fontFamily: "'Inter', sans-serif", fontSize: '8px', fontWeight: 300, letterSpacing: '0.35em', opacity: 0.9}}>CASAS BOUTIQUE</text>
          </svg>
        </div>

        {/* Contenido colapsable del header */}
        <div className={`transition-all duration-300 overflow-hidden ${headerCollapsed ? 'max-h-0' : 'max-h-[500px]'}`}>
          <div className="px-4 sm:px-8 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="mb-3">
                <h1 className="text-lg sm:text-xl font-bold text-white">{projectTitle}</h1>
                <div className="text-sm opacity-80">{data.ciudad} | {calculations.m2Totales} m2 totales</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 pt-3 border-t border-white border-opacity-30">
                <div>
                  <div className="text-xs opacity-70">Precio Compra</div>
                  <div className="font-semibold text-sm sm:text-base">{formatCurrency(data.precioCompra)}</div>
                  <div className="text-xs opacity-70 hidden sm:block">{formatCurrency(data.precioCompra / calculations.m2Totales)}/m2</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Precio Venta</div>
                  <div className="font-semibold text-sm sm:text-base">{formatCurrency(data.precioVenta)}</div>
                  <div className="text-xs opacity-70 hidden sm:block">{formatCurrency(data.precioVenta / calculations.m2Totales)}/m2</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs opacity-70">Inversion Total</div>
                  <div className="font-semibold">{formatCurrency(calculations.inversionTotal)}</div>
                  <div className="text-xs opacity-70">{formatCurrency(calculations.euroM2Inversion)}/m2</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">ROI</div>
                  <div className="text-xl sm:text-2xl font-bold">{formatPercent(calculations.roi)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Margen</div>
                  <div className="text-xl sm:text-2xl font-bold">{formatPercent(calculations.margen)}</div>
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs opacity-70">TIR Anual</div>
                  <div className={`text-2xl font-bold ${calculations.tir >= 30 ? "text-green-400" : calculations.tir >= 20 ? "text-yellow-400" : "text-red-400"}`}>{formatPercent(calculations.tir)}</div>
                  <div className="text-xs opacity-70">{calculations.mesesProyecto.toFixed(1)} meses</div>
                </div>
                <div className={`rounded-lg p-2 -my-1 col-span-2 sm:col-span-1 ${calculations.margen >= 16 ? "bg-green-600" : calculations.margen >= 13 ? "bg-orange-500" : "bg-red-600"}`}>
                  <div className="text-xs opacity-90">Beneficio Neto</div>
                  <div className="text-xl sm:text-2xl font-extrabold">{formatCurrency(calculations.beneficioNeto)}</div>
                  <div className="text-xs font-semibold">{calculations.margen >= 16 ? "OPORTUNIDAD" : calculations.margen >= 13 ? "AJUSTADO" : "NO HACER"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini header cuando esta colapsado (solo mobile) */}
        {headerCollapsed && (
          <div className="lg:hidden px-4 py-2 flex items-center justify-between text-sm">
            <span className="font-medium truncate flex-1">{data.direccion || project?.name}</span>
            <div className={`px-2 py-1 rounded text-xs font-bold ${calculations.margen >= 16 ? "bg-green-600" : calculations.margen >= 13 ? "bg-orange-500" : "bg-red-600"}`}>
              {formatCurrency(calculations.beneficioNeto)} ({formatPercent(calculations.margen)})
            </div>
          </div>
        )}
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
                <SummaryRow
                  label="Compra de piso"
                  value={formatCurrency(data.precioCompra)}
                  tooltip="Precio de compra del inmueble"
                  editable
                  onEdit={(v) => updateField('precioCompra', v)}
                />
                <SummaryRow
                  label="Honorario compra"
                  value={formatCurrency(calculations.honorarioCompra)}
                  indent
                  tooltip={`Precio Compra × ${data.porcentajeIntermediacionCompra}% × 1.21 (IVA)\n= ${formatCurrency(data.precioCompra)} × ${data.porcentajeIntermediacionCompra/100} × 1.21`}
                />
                <SummaryRow
                  label="Inscripcion escritura"
                  value={formatCurrency(calculations.inscripcionEscritura)}
                  indent
                  tooltip="Coste fijo de inscripcion = 1.530 EUR"
                />
                <SummaryRow
                  label="ITP"
                  value={formatCurrency(calculations.itp)}
                  indent
                  tooltip={`Impuesto Transmisiones Patrimoniales\n= Precio Compra × 2%\n= ${formatCurrency(data.precioCompra)} × 0.02`}
                />
                <SummaryRow
                  label="Total Adquisicion"
                  value={formatCurrency(calculations.totalAdquisicion)}
                  highlight
                  tooltip="Compra + Honorarios + Inscripcion + ITP"
                />
              </div>
              <div className="border-t pt-3 mt-3 space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Gastos</div>
                <SummaryRow
                  label="Hard Costs"
                  value={formatCurrency(calculations.hardCosts)}
                  tooltip="Obra + Materiales + Interiorismo + Mobiliario + Terraza + Extras"
                />
                <SummaryRow
                  label="Obra"
                  value={formatCurrency(calculations.obra)}
                  indent
                  tooltip={`m2 Construidos × Coste/m2 segun calidad\n= ${data.m2Construidos} m2 × ${[350,420,560,700,900][(data.calidad || 3)-1] || 560} EUR/m2`}
                />
                <SummaryRow
                  label="Calidad materiales"
                  value={formatCurrency(calculations.calidadCoste)}
                  indent
                  tooltip={`m2 Construidos × Coste materiales/m2\n= ${data.m2Construidos} m2 × ${[300,400,512,650,850][(data.calidad || 3)-1] || 512} EUR/m2`}
                />
                <SummaryRow
                  label="Interiorismo"
                  value={formatCurrency(calculations.interiorismo)}
                  indent
                  tooltip={`m2 × Coste interiorismo/m2${data.esClasico ? ' + 790 EUR (estilo clasico)' : ''}\n= ${data.m2Construidos} × ${[40,50,59.1,75,95][(data.calidad || 3)-1] || 59.1}${data.esClasico ? ' + 790' : ''}`}
                />
                <SummaryRow
                  label="Mobiliario"
                  value={formatCurrency(calculations.mobiliario)}
                  indent
                  tooltip={`m2 × Coste mobiliario/m2\n= ${data.m2Construidos} × ${[60,80,101.7,130,170][(data.calidad || 3)-1] || 101.7} EUR/m2`}
                />
                {calculations.extras > 0 && (
                  <SummaryRow
                    label="Extras"
                    value={formatCurrency(calculations.extras)}
                    indent
                    tooltip="Costes adicionales personalizados"
                    editable
                    onEdit={(v) => updateField('extras', v)}
                  />
                )}
                <SummaryRow
                  label="Soft Costs"
                  value={formatCurrency(calculations.softCosts)}
                  tooltip="Arquitectura + Permisos + Gastos venta + Tenencia + Plusvalia"
                />
                <SummaryRow
                  label="Arquitectura"
                  value={formatCurrency(calculations.arquitectura)}
                  indent
                  tooltip={`m2 × Coste arquitectura/m2\n= ${data.m2Construidos} × ${[25,32,38.3,48,60][(data.calidad || 3)-1] || 38.3} EUR/m2`}
                />
                <SummaryRow
                  label="Permiso construccion"
                  value={formatCurrency(calculations.permisoConstruccion)}
                  indent
                  tooltip={`m2 × 34.2 EUR/m2\n= ${data.m2Construidos} × 34.2`}
                />
                <SummaryRow
                  label="Costos tenencia"
                  value={formatCurrency(calculations.costosTenencia)}
                  indent
                  tooltip="Coste fijo = 2.490 EUR\n(IBI, comunidad, seguros durante obra)"
                />
                <SummaryRow
                  label="Plusvalia"
                  value={formatCurrency(calculations.plusvalia)}
                  indent
                  tooltip={`Precio Venta × 0.27%\n= ${formatCurrency(data.precioVenta)} × 0.0027`}
                />
                <SummaryRow
                  label="Total Gastos"
                  value={formatCurrency(calculations.totalGastos)}
                  highlight
                  tooltip="Hard Costs + Soft Costs"
                />
              </div>
              <div className="border-t pt-3 mt-3 space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Venta</div>
                <SummaryRow
                  label="Precio de venta"
                  value={formatCurrency(data.precioVenta)}
                  tooltip="Precio de venta esperado del inmueble reformado"
                  editable
                  onEdit={(v) => updateField('precioVenta', v)}
                />
                <SummaryRow
                  label="Honorarios venta"
                  value={`-${formatCurrency(calculations.honorariosVenta)}`}
                  indent
                  tooltip={`Precio Venta × ${data.porcentajeIntermediacionVenta}% × 1.21 (IVA)\n= ${formatCurrency(data.precioVenta)} × ${data.porcentajeIntermediacionVenta/100} × 1.21`}
                />
                <SummaryRow
                  label="Venta Neta"
                  value={formatCurrency(calculations.ventaNeta)}
                  highlight
                  tooltip="Precio Venta - Honorarios Venta"
                />
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

            {/* Cuadro Precio Maximo de Compra para 13% */}
            <div className={`rounded-xl card-shadow p-4 ${data.precioCompra <= precioCompraMaximo13 ? 'bg-green-50 border-2 border-green-400' : 'bg-red-50 border-2 border-red-400'}`}>
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <svg className={`w-5 h-5 ${data.precioCompra <= precioCompraMaximo13 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Precio Maximo de Compra
              </h3>
              <div className="text-xs text-gray-600 mb-3">
                Para alcanzar un <span className="font-semibold">margen minimo del 13%</span>
              </div>
              <div className={`text-2xl font-bold ${data.precioCompra <= precioCompraMaximo13 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(precioCompraMaximo13)}
              </div>
              <div className="mt-2 text-sm">
                {data.precioCompra <= precioCompraMaximo13 ? (
                  <div className="text-green-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Precio actual OK ({formatCurrency(precioCompraMaximo13 - data.precioCompra)} de margen)
                  </div>
                ) : (
                  <div className="text-red-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Exceso: {formatCurrency(data.precioCompra - precioCompraMaximo13)}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Con PV: {formatCurrency(data.precioVenta)} y calidad {data.calidad}★
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

function SummaryRow({ label, value, highlight = false, indent = false, tooltip, editable, onEdit }: {
  label: string;
  value: string;
  highlight?: boolean;
  indent?: boolean;
  tooltip?: string;
  editable?: boolean;
  onEdit?: (newValue: number) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const handleStartEdit = () => {
    if (!editable || !onEdit) return
    const numValue = parseInt(value.replace(/[^\d-]/g, '')) || 0
    setEditValue(String(Math.abs(numValue)))
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (onEdit) {
      const newValue = parseInt(editValue.replace(/[^\d]/g, '')) || 0
      onEdit(newValue)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') setIsEditing(false)
  }

  return (
    <div
      className={`flex justify-between py-1.5 ${highlight ? "font-semibold text-base" : "text-sm"} ${indent ? "pl-4" : ""} ${tooltip ? "cursor-help" : ""} ${editable ? "hover:bg-blue-50 rounded px-1 -mx-1 cursor-pointer" : ""} relative group`}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleStartEdit}
    >
      <span className={`${highlight ? "text-gray-800" : "text-gray-600"} flex items-center gap-1`}>
        {label}
        {tooltip && (
          <svg className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {editable && (
          <svg className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )}
      </span>
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="w-24 text-right px-1 py-0 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={highlight ? "text-blue-600" : "text-gray-800"}>{value}</span>
      )}

      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs whitespace-pre-line">
          <div className="font-semibold mb-1 text-yellow-400">Formula:</div>
          {tooltip}
          <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      )}
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
        requiredPrice13: calculateRequiredSalePrice(calc.inversionBase, 13, params.intermediacionVenta, params.porcentajeIntermediacionVenta),
        requiredPrice15: calculateRequiredSalePrice(calc.inversionBase, 15, params.intermediacionVenta, params.porcentajeIntermediacionVenta),
        requiredPrice20: calculateRequiredSalePrice(calc.inversionBase, 20, params.intermediacionVenta, params.porcentajeIntermediacionVenta),
        requiredPriceCustom,
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
      <div className="mb-4 flex flex-wrap items-center gap-4 no-print">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Margen objetivo:</span>
          <input type="range" min="5" max="30" value={targetMargin} onChange={(e) => setTargetMargin(parseInt(e.target.value))} className="w-32" />
          <span className="font-bold text-blue-600 min-w-[3rem]">{targetMargin}%</span>
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          PV actual: <span className="font-semibold">{formatCurrency(precioVenta)}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-2">Calidad</th>
              <th className="text-right py-3 px-2">Inversion</th>
              <th className="text-right py-3 px-2">PV 13%</th>
              <th className="text-right py-3 px-2">PV 15%</th>
              <th className="text-right py-3 px-2">PV 20%</th>
              <th className="text-right py-3 px-2 bg-blue-50 border-l-2 border-blue-200">
                <div className="text-blue-700">PV {targetMargin}%</div>
                <div className="text-xs font-normal text-blue-500">Precio Venta</div>
              </th>
              <th className="text-right py-3 px-2 bg-green-50">
                <div className="text-green-700">Beneficio</div>
                <div className="text-xs font-normal text-green-500">con {targetMargin}%</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {qualityData.map((row) => (
              <tr key={row.qualityLevel} className={`border-b ${row.qualityLevel === currentQuality ? "bg-yellow-50 font-semibold" : ""}`}>
                <td className="py-3 px-2">
                  <span className="text-yellow-500">{"★".repeat(row.qualityLevel)}</span>
                  <span className="text-gray-300">{"★".repeat(5 - row.qualityLevel)}</span>
                  {row.qualityLevel === currentQuality && <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">Actual</span>}
                </td>
                <td className="text-right py-3 px-2">{formatCurrency(row.inversionBase)}</td>
                <td className="text-right py-3 px-2 text-gray-600">{formatCurrency(row.requiredPrice13)}</td>
                <td className="text-right py-3 px-2 text-gray-600">{formatCurrency(row.requiredPrice15)}</td>
                <td className="text-right py-3 px-2 text-gray-600">{formatCurrency(row.requiredPrice20)}</td>
                <td className="text-right py-3 px-2 bg-blue-50 border-l-2 border-blue-200 font-bold text-blue-700">
                  {formatCurrency(row.requiredPriceCustom)}
                </td>
                <td className={`text-right py-3 px-2 bg-green-50 font-semibold ${row.beneficioEsperado >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(row.beneficioEsperado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-semibold text-blue-700 mb-1">Precio de Venta necesario ({targetMargin}%)</div>
          <div className="text-gray-600">
            Para la calidad actual ({currentQuality}★), necesitas vender a{' '}
            <span className="font-bold text-blue-700">{formatCurrency(qualityData.find(q => q.qualityLevel === currentQuality)?.requiredPriceCustom || 0)}</span>
            {' '}para conseguir un margen del {targetMargin}%
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="font-semibold text-gray-700 mb-1">Diferencia con PV actual</div>
          {(() => {
            const currentRow = qualityData.find(q => q.qualityLevel === currentQuality)
            const diff = (currentRow?.requiredPriceCustom || 0) - precioVenta
            return (
              <div className={`${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {diff > 0
                  ? `Necesitas subir el precio ${formatCurrency(diff)} para el ${targetMargin}%`
                  : `Tu precio actual da margen de sobra (${formatCurrency(Math.abs(diff))} extra)`
                }
              </div>
            )
          })()}
        </div>
      </div>
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
