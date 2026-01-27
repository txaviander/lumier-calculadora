'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile, UserRole } from '@/lib/types'

// =====================================================
// useUsers - Lista de usuarios con filtros
// =====================================================
interface UseUsersOptions {
  role?: UserRole
  isActive?: boolean
  search?: string
}

interface UseUsersReturn {
  users: UserProfile[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  totalCount: number
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { role, isActive, search } = options
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })

      if (role) {
        query = query.eq('role', role)
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      query = query.order('full_name', { ascending: true })

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      setUsers(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err : new Error('Error al cargar usuarios'))
    } finally {
      setLoading(false)
    }
  }, [role, isActive, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    totalCount
  }
}

// =====================================================
// useUserById - Usuario individual
// =====================================================
export function useUserById(userId: string | null) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(!!userId)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (queryError) throw queryError

      setUser(data)
    } catch (err) {
      console.error('Error fetching user:', err)
      setError(err instanceof Error ? err : new Error('Error al cargar usuario'))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return {
    user,
    loading,
    error,
    refetch: fetchUser
  }
}

// =====================================================
// useUserMutations - Actualizar usuarios
// =====================================================
interface UpdateUserInput {
  full_name?: string
  phone?: string
  role?: UserRole
  is_active?: boolean
  avatar_url?: string
}

export function useUserMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateUser = useCallback(async (
    userId: string,
    updates: UpdateUserInput
  ): Promise<UserProfile> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al actualizar usuario')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCurrentUserProfile = useCallback(async (
    updates: Omit<UpdateUserInput, 'role' | 'is_active'>
  ): Promise<UserProfile> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al actualizar perfil')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleUserActive = useCallback(async (
    userId: string,
    isActive: boolean
  ): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al cambiar estado')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    updateUser,
    updateCurrentUserProfile,
    toggleUserActive,
    loading,
    error
  }
}

// =====================================================
// Utilidades de roles
// =====================================================
export const roleLabels: Record<UserRole, string> = {
  comercial: 'Comercial',
  project_manager: 'Project Manager',
  financiero: 'Financiero',
  diseno: 'Diseño',
  direccion: 'Dirección',
  legal: 'Legal',
  marketing: 'Marketing',
  rrhh: 'RRHH',
  admin: 'Administrador'
}

export const roleColors: Record<UserRole, { bg: string; text: string }> = {
  comercial: { bg: 'bg-blue-100', text: 'text-blue-700' },
  project_manager: { bg: 'bg-purple-100', text: 'text-purple-700' },
  financiero: { bg: 'bg-green-100', text: 'text-green-700' },
  diseno: { bg: 'bg-pink-100', text: 'text-pink-700' },
  direccion: { bg: 'bg-amber-100', text: 'text-amber-700' },
  legal: { bg: 'bg-slate-100', text: 'text-slate-700' },
  marketing: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  rrhh: { bg: 'bg-orange-100', text: 'text-orange-700' },
  admin: { bg: 'bg-red-100', text: 'text-red-700' }
}
