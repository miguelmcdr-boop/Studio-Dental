import { useEffect, useRef } from 'react'
import { supabase, USE_SUPABASE } from '../services/supabaseClient'

/**
 * Hook que escucha cambios de estado de autenticación de Supabase (F6-H).
 *
 * Detecta:
 * - SIGNED_OUT (logout desde otra pestaña o admin expulsó usuario): hace logout aquí también
 * - TOKEN_REFRESHED (token renovado): noop, Supabase ya lo maneja
 * - USER_DELETED (admin borró el usuario): hace logout forzado
 * - PASSWORD_RECOVERY / MFA_CHALLENGE: noop por ahora
 *
 * @param {Object} options
 * @param {boolean} options.activo - Si el listener está activo
 * @param {Function} options.onLogout - Callback para logout forzado (debe llamar a sesionStore.logout())
 */
export const useAuthStateListener = ({ activo, onLogout }) => {
  const logoutRef = useRef(onLogout)
  logoutRef.current = onLogout

  useEffect(() => {
    if (!activo || !USE_SUPABASE || !supabase) return

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // SIGNED_OUT desde otra pestaña o por expiración
        if (event === 'SIGNED_OUT') {
          console.log('[useAuthStateListener] SIGNED_OUT detectado, sincronizando logout')
          if (logoutRef.current) logoutRef.current()
          return
        }

        // Admin borró el usuario desde Supabase Dashboard
        if (event === 'USER_DELETED') {
          console.warn('[useAuthStateListener] USER_DELETED: usuario removido por admin')
          if (logoutRef.current) logoutRef.current()
          return
        }

        // Refresh falló (token no se pudo renovar)
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('[useAuthStateListener] TOKEN_REFRESHED sin sesión, logout forzado')
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
