import { supabase } from './supabase'

// Dominio permitido para login (solo emails de Lumier)
export const ALLOWED_DOMAIN = 'lumier.es'

// Verificar si un email pertenece al dominio permitido
export function isAllowedEmail(email: string): boolean {
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase()
  return domain === ALLOWED_DOMAIN
}

// Iniciar sesión con Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        hd: ALLOWED_DOMAIN // Sugiere a Google mostrar solo cuentas del dominio
      }
    }
  })

  if (error) throw error
  return data
}

// Cerrar sesión
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Obtener usuario actual
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Obtener sesión actual
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Escuchar cambios de autenticación
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
