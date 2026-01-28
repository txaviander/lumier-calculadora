/**
 * BREADCRUMB - Memoria del Proyecto
 *
 * Este hook usa el SISTEMA NUEVO (projects_v2, calculator_snapshots).
 * NO es compatible con el sistema antiguo usado en /calculadora/page.tsx.
 *
 * 28/01/2026 - ANTI-PATTERN DETECTADO Y SOLUCIONADO:
 * El parámetro `filters = {}` creaba un objeto nuevo en cada render,
 * causando re-fetches infinitos y parpadeo en la UI.
 *
 * Solución correcta (si se necesita):
 *   const EMPTY_FILTERS = {}
 *   function useProjects({ filters = EMPTY_FILTERS }) { ... }
 *   const filtersKey = useMemo(() => JSON.stringify(filters), [filters])
 *
 * IMPORTANTE: Este hook NO debe usarse en /calculadora/page.tsx
 * Ver `.claude/decisions.md` para el análisis completo.
 *
 * Última modificación: 28/01/2026
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  Project,
  ProjectListItem,
  ProjectFilters,
  ProjectStatus,
  RenovationType,
  ApproveRejectResponse,
  DashboardStatsResponse
} from '@/lib/types'

// =====================================================
// useProjects - Lista de proyectos con filtros
// =====================================================
interface UseProjectsOptions {
  filters?: ProjectFilters
  autoFetch?: boolean
}

interface UseProjectsReturn {
  projects: ProjectListItem[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  totalCount: number
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { filters = {}, autoFetch = true } = options
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('projects_v2')
        .select(`
          project_id,
          project_code,
          status,
          property_address,
          property_city,
          property_size_m2,
          purchase_price,
          estimated_sale_price,
          net_margin_percentage,
          roi_percentage,
          renovation_type,
          created_at,
          updated_at,
          commercial_user_id
        `, { count: 'exact' })

      // Aplicar filtros
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.renovation_type && filters.renovation_type.length > 0) {
        query = query.in('renovation_type', filters.renovation_type)
      }

      if (filters.commercial_user_id) {
        query = query.eq('commercial_user_id', filters.commercial_user_id)
      }

      if (filters.city) {
        query = query.ilike('property_city', `%${filters.city}%`)
      }

      if (filters.search) {
        query = query.or(
          `property_address.ilike.%${filters.search}%,` +
          `project_code.ilike.%${filters.search}%,` +
          `property_city.ilike.%${filters.search}%`
        )
      }

      if (filters.min_margin !== undefined) {
        query = query.gte('net_margin_percentage', filters.min_margin)
      }

      if (filters.max_margin !== undefined) {
        query = query.lte('net_margin_percentage', filters.max_margin)
      }

      // Ordenar por fecha de actualización descendente
      query = query.order('updated_at', { ascending: false })

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      // Obtener información del comercial para cada proyecto
      const projectsWithCommercial: ProjectListItem[] = await Promise.all(
        (data || []).map(async (project) => {
          let commercial = null
          if (project.commercial_user_id) {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('id, full_name, avatar_url')
              .eq('id', project.commercial_user_id)
              .single()
            commercial = userData
          }
          return { ...project, commercial }
        })
      )

      setProjects(projectsWithCommercial)
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err : new Error('Error al cargar proyectos'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (autoFetch) {
      fetchProjects()
    }
  }, [autoFetch, fetchProjects])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    totalCount
  }
}

// =====================================================
// useProject - Proyecto individual
// =====================================================
interface UseProjectReturn {
  project: Project | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateProject: (updates: Partial<Project>) => Promise<void>
}

export function useProject(projectId: string | null): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(!!projectId)
  const [error, setError] = useState<Error | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('projects_v2')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (queryError) throw queryError

      setProject(data)
    } catch (err) {
      console.error('Error fetching project:', err)
      setError(err instanceof Error ? err : new Error('Error al cargar proyecto'))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const updateProject = useCallback(async (updates: Partial<Project>) => {
    if (!projectId) throw new Error('No hay proyecto cargado')

    try {
      const { error: updateError } = await supabase
        .from('projects_v2')
        .update(updates)
        .eq('project_id', projectId)

      if (updateError) throw updateError

      // Actualizar estado local
      setProject(prev => prev ? { ...prev, ...updates } : null)
    } catch (err) {
      console.error('Error updating project:', err)
      throw err
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
    updateProject
  }
}

// =====================================================
// useProjectMutations - Crear/Aprobar/Rechazar
// =====================================================
interface CreateProjectInput {
  property_address: string
  property_city?: string
  property_district?: string
  property_size_m2?: number
  property_bedrooms?: number
  property_bathrooms?: number
  purchase_price?: number
  estimated_sale_price?: number
  renovation_type?: RenovationType
  notes?: string
}

interface UseProjectMutationsReturn {
  createProject: (input: CreateProjectInput) => Promise<Project>
  approveProject: (projectId: string) => Promise<ApproveRejectResponse>
  rejectProject: (projectId: string, reason: string) => Promise<ApproveRejectResponse>
  deleteProject: (projectId: string) => Promise<void>
  loading: boolean
  error: Error | null
}

export function useProjectMutations(): UseProjectMutationsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createProject = useCallback(async (input: CreateProjectInput): Promise<Project> => {
    setLoading(true)
    setError(null)

    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error: insertError } = await supabase
        .from('projects_v2')
        .insert({
          ...input,
          created_by_user_id: user?.id,
          commercial_user_id: user?.id // Por defecto el creador es el comercial
        })
        .select()
        .single()

      if (insertError) throw insertError

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al crear proyecto')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const approveProject = useCallback(async (projectId: string): Promise<ApproveRejectResponse> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error: rpcError } = await supabase
        .rpc('approve_project', {
          p_project_id: projectId,
          p_user_id: user.id
        })

      if (rpcError) throw rpcError

      return data as ApproveRejectResponse
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al aprobar proyecto')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const rejectProject = useCallback(async (
    projectId: string,
    reason: string
  ): Promise<ApproveRejectResponse> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error: rpcError } = await supabase
        .rpc('reject_project', {
          p_project_id: projectId,
          p_user_id: user.id,
          p_reason: reason
        })

      if (rpcError) throw rpcError

      return data as ApproveRejectResponse
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al rechazar proyecto')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('projects_v2')
        .delete()
        .eq('project_id', projectId)

      if (deleteError) throw deleteError
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al eliminar proyecto')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createProject,
    approveProject,
    rejectProject,
    deleteProject,
    loading,
    error
  }
}

// =====================================================
// useDashboardStats
// =====================================================
interface UseDashboardStatsReturn {
  stats: DashboardStatsResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats')

      if (rpcError) throw rpcError

      setStats(data as DashboardStatsResponse)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error ? err : new Error('Error al cargar estadísticas'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
