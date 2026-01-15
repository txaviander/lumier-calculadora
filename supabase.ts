import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface Project {
  id: string
  slug: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ProjectVersion {
  id: string
  project_id: string
  version_number: number
  version_name: string
  data: CalculatorData
  created_at: string
  is_active: boolean
}

export interface Comentario {
  id: number
  texto: string
  autor: string
  fecha: string
}

export interface CalculatorData {
  // Datos del inmueble
  ciudad: string
  direccion: string
  planta: string
  m2Construidos: number
  m2ZZCC: number
  terrazaM2: number
  exterior: string
  ascensor: boolean
  portero: boolean
  ite: boolean
  garaje: boolean
  toldoPergola: boolean

  // Compra
  precioCompra: number
  fechaCompra: string
  intermediacionCompra: boolean
  porcentajeIntermediacionCompra: number

  // Venta
  precioVenta: number
  fechaVenta: string
  intermediacionVenta: boolean
  porcentajeIntermediacionVenta: number

  // Reforma
  calidad: number
  habitaciones: number
  banos: number
  esClasico: boolean
  ventanas: number
  calefaccion: string
  climatizacion: string
  extras: number

  // Financiacion
  deuda: number
  interesFinanciero: number

  // Comentarios
  comentarios: Comentario[]
}

// Funciones de base de datos
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const slug = generateSlug(name)

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, slug, description })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
  const { data, error } = await supabase
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getActiveVersion(projectId: string): Promise<ProjectVersion | null> {
  const { data, error } = await supabase
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

export async function getVersionByNumber(projectId: string, versionNumber: number): Promise<ProjectVersion | null> {
  const { data, error } = await supabase
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .eq('version_number', versionNumber)
    .single()

  if (error) return null
  return data
}

export async function createVersion(
  projectId: string,
  versionName: string,
  data: CalculatorData
): Promise<ProjectVersion> {
  // Obtener el siguiente numero de version
  const { data: versions } = await supabase
    .from('project_versions')
    .select('version_number')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1

  // Desactivar versiones anteriores
  await supabase
    .from('project_versions')
    .update({ is_active: false })
    .eq('project_id', projectId)

  // Crear nueva version activa
  const { data: newVersion, error } = await supabase
    .from('project_versions')
    .insert({
      project_id: projectId,
      version_number: nextVersion,
      version_name: versionName,
      data,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error

  // Actualizar timestamp del proyecto
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)

  return newVersion
}

export async function setActiveVersion(projectId: string, versionId: string): Promise<void> {
  // Desactivar todas las versiones
  await supabase
    .from('project_versions')
    .update({ is_active: false })
    .eq('project_id', projectId)

  // Activar la version seleccionada
  await supabase
    .from('project_versions')
    .update({ is_active: true })
    .eq('id', versionId)
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw error
}

// Interfaz para proyecto con métricas
export interface ProjectWithMetrics extends Project {
  activeVersion?: ProjectVersion | null
  metrics?: {
    precioCompra: number
    precioVenta: number
    inversionTotal: number
    beneficioNeto: number
    margen: number
    roi: number
    m2Totales: number
    ciudad: string
    direccion: string
  } | null
}

// Función para calcular métricas desde CalculatorData
export function calculateMetricsFromData(data: CalculatorData): ProjectWithMetrics['metrics'] {
  if (!data) return null

  const m2Totales = (data.m2Construidos || 0) + (data.m2ZZCC || 0)

  // Cálculos de adquisición
  const honorarioCompraBase = data.intermediacionCompra ? data.precioCompra * (data.porcentajeIntermediacionCompra / 100) : 0
  const honorarioCompra = honorarioCompraBase * 1.21
  const inscripcionEscritura = 1530
  const itp = data.precioCompra * 0.02
  const totalAdquisicion = data.precioCompra + honorarioCompra + inscripcionEscritura + itp

  // Cálculos de reforma (hard costs)
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
  const hardCosts = obra + calidadCoste + interiorismo + mobiliario + terrazaCost + toldoCost + (data.extras || 0)

  // Soft costs
  const arquitecturaFija: Record<number, number> = { 1: 3630, 2: 3630, 3: 6050, 4: 12100, 5: 18150 }
  const arquitectura = arquitecturaFija[data.calidad] || 6050
  const permisoConstruccion = data.m2Construidos * 34.2
  const gastosVenta = 800
  const costosTenencia = 2490
  const plusvalia = data.precioVenta * 0.0027
  const softCosts = arquitectura + permisoConstruccion + gastosVenta + costosTenencia + plusvalia
  const totalGastos = hardCosts + softCosts

  // Venta
  const honorariosVentaBase = data.intermediacionVenta ? data.precioVenta * (data.porcentajeIntermediacionVenta / 100) : 0
  const honorariosVenta = honorariosVentaBase * 1.21
  const ventaNeta = data.precioVenta - honorariosVenta

  // Financiación
  const interesProyecto = data.deuda * (data.interesFinanciero / 100) / 2

  // Totales
  const inversionTotal = totalAdquisicion + totalGastos + interesProyecto
  const beneficioNeto = ventaNeta - inversionTotal
  const roi = inversionTotal > 0 ? (beneficioNeto / inversionTotal) * 100 : 0
  const margen = data.precioVenta > 0 ? (beneficioNeto / data.precioVenta) * 100 : 0

  return {
    precioCompra: data.precioCompra || 0,
    precioVenta: data.precioVenta || 0,
    inversionTotal,
    beneficioNeto,
    margen,
    roi,
    m2Totales,
    ciudad: data.ciudad || '',
    direccion: data.direccion || ''
  }
}

// Obtener proyectos con métricas de la versión activa
export async function getProjectsWithMetrics(): Promise<ProjectWithMetrics[]> {
  // Obtener todos los proyectos
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (projectsError) throw projectsError
  if (!projects) return []

  // Obtener las versiones activas de todos los proyectos
  const projectIds = projects.map(p => p.id)
  const { data: activeVersions, error: versionsError } = await supabase
    .from('project_versions')
    .select('*')
    .in('project_id', projectIds)
    .eq('is_active', true)

  if (versionsError) throw versionsError

  // Combinar proyectos con sus métricas
  return projects.map(project => {
    const activeVersion = activeVersions?.find(v => v.project_id === project.id) || null
    const metrics = activeVersion?.data ? calculateMetricsFromData(activeVersion.data) : null

    return {
      ...project,
      activeVersion,
      metrics
    }
  })
}

// Utilidad para generar slugs
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Agregar sufijo aleatorio para unicidad
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}
