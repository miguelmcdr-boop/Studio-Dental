import { useEffect, useRef } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase, USE_SUPABASE } from '../services/supabaseClient'
import { createLogger } from '../services/logger'

const log = createLogger('useAuthStateListener')

export interface UseAuthStateListenerOptions {
  activo: boolean
  onLogout: () => void
}

/**
 * Hook que escucha cambios de estado de autenticación de Supabase (F6-H).
 *
 * Detecta:
 * - SIGNED_OUT (logout desde otra pestaña o admin expulsó usuario): hace logout aquí también
 * - TOKEN_REFRESHED (token renovado): noop, Supabase ya lo maneja
 * - USER_DELETED (admin borró el usuario): hace logout forzado
 * - PASSWORD_RECOVERY / MFA_CHALLENGE: noop por ahora
 *
 * @param options Opciones de configuración
 * @param options.activo - Si el listener está activo
 * @param options.onLogout - Callback para logout forzado (debe llamar a sesionStore.logout())
 */
export const useAuthStateListener = ({ activo, onLogout }: UseAuthStateListenerOptions): void => {
  const logoutRef = useRef<() => void>(onLogout)
  logoutRef.current = onLogout

  useEffect(() => {
    if (!activo || !USE_SUPABASE || !supabase) return

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // SIGNED_OUT desde otra pestaña o por expiración
        if (event === 'SIGNED_OUT') {
          log.info('SIGNED_OUT detectado, sincronizando logout')
          if (logoutRef.current) logoutRef.current()
          return
        }

        // Admin borró el usuario desde Supabase Dashboard
        if ((event as string) === 'USER_DELETED') {
          log.warn('USER_DELETED: usuario removido por admin')
          if (logoutRef.current) logoutRef.current()
          return
        }

        // Refresh falló (token no se pudo renovar)
        if (event === 'TOKEN_REFRESHED' && !session) {
          log.warn('TOKEN_REFRESHED sin sesión, logout forzado')
          if (logoutRef.current) logoutRef.current()
          return
        }

        // Eventos que no requieren acción:
        // SIGNED_IN (ya manejado por App.jsx en restauración)
        // INITIAL_SESSION (ya manejado por App.jsx)
        // PASSWORD_RECOVERY, MFA_CHALLENGE (no aplican en esta app)
      }
    )

    return () => {
      if (subscription?.subscription) {
        subscription.subscription.unsubscribe()
      }
    }
  }, [activo])
}
