'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'

interface UseUserProfileReturn {
  profile: UserProfile | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) {
        setProfile(null)
        return
      }

      // Obtener perfil del usuario
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        // Si no existe el perfil, puede que aún no se haya creado
        if (profileError.code === 'PGRST116') {
          // El trigger debería crearlo automáticamente, pero por si acaso
          console.warn('Profile not found, it may be creating...')
          setProfile(null)
        } else {
          throw profileError
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) throw new Error('No hay perfil cargado')

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Actualizar estado local
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    } catch (err) {
      console.error('Error updating profile:', err)
      throw err
    }
  }, [profile])

  useEffect(() => {
    fetchProfile()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          await fetchProfile()
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile
  }
}

// Hook para verificar permisos
export function usePermissions() {
  const { profile } = useUserProfile()

  const canApproveProjects = profile?.role
    ? ['direccion', 'financiero', 'admin'].includes(profile.role)
    : false

  const canCreateProjects = profile?.role
    ? ['comercial', 'direccion', 'admin'].includes(profile.role)
    : false

  const canEditAllProjects = profile?.role
    ? ['direccion', 'financiero', 'admin'].includes(profile.role)
    : false

  const canViewFinancials = profile?.role
    ? ['financiero', 'direccion', 'admin'].includes(profile.role)
    : false

  return {
    canApproveProjects,
    canCreateProjects,
    canEditAllProjects,
    canViewFinancials,
    role: profile?.role || null
  }
}
