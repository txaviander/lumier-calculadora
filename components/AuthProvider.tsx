'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isAllowedEmail, signOut, ALLOWED_DOMAIN } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {}
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Verificar que el email pertenece al dominio permitido
          if (isAllowedEmail(session.user.email || '')) {
            setUser(session.user)
          } else {
            // Email no permitido, cerrar sesión
            console.warn(`Acceso denegado para: ${session.user.email}`)
            await signOut()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Verificar dominio al iniciar sesión
          if (isAllowedEmail(session.user.email || '')) {
            setUser(session.user)
          } else {
            // Cerrar sesión si el dominio no es válido
            alert(`Acceso denegado.\n\nSolo se permite el acceso con cuentas de correo @${ALLOWED_DOMAIN}`)
            await signOut()
            setUser(null)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}
