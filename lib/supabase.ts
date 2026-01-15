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
