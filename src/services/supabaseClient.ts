/**
 * Cliente de Supabase para Studio Dental (F4-02a).
 *
 * Centraliza la configuración de conexión a Supabase. Todos los servicios
 * de storage y hooks de autenticación deben importar desde este archivo
 * en lugar de crear sus propias instancias.
 *
 * Las credenciales se cargan desde variables de entorno de Vite:
 * - VITE_SUPABASE_URL: URL del proyecto Supabase
 * - VITE_SUPABASE_ANON_KEY: clave pública (segura para frontend)
 *
 * NOTA: La anon key es pública por diseño. La seguridad real está en
 * las políticas de Row Level Security (RLS) configuradas en Supabase.
 * NUNCA exponer la service_role key en el frontend.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createLogger } from './logger'

const log = createLogger('supabaseClient')

// Re-exportar tipo SupabaseClient para uso en toda la aplicación
export type { SupabaseClient }

// Cargar variables de entorno de Vite
// F7-37 v4 H-12: exportar para que papeleraCertificadosService pueda llamar a archivos-purge
export const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY

// Feature flag para activar/desactivar Supabase (estrategia de reversibilidad)
export const USE_SUPABASE: boolean = import.meta.env.VITE_USE_SUPABASE === 'true'

/**
 * Valida que las variables de entorno estén configuradas correctamente.
 * Retorna true si Supabase está listo para usarse.
 */
export const isSupabaseConfigured = (): boolean => {
  if (!USE_SUPABASE) return false
  if (!supabaseUrl || !supabaseAnonKey) {
    log.warn(
      '[supabaseClient] Supabase no configurado. ' +
      'Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env'
    )
    return false
  }
  return true
}

/**
 * Cliente de Supabase (singleton).
 * Si las variables no están configuradas, retorna null para permitir
 * fallback a localStorage sin romper la app.
 */
export const supabase: SupabaseClient | null = (isSupabaseConfigured() && supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Persistir sesión en localStorage (necesario para mantener login tras refresh)
        persistSession: true,
        // Detectar sesiones automáticamente al cargar la app
        autoRefreshToken: true,
        // Detectar cambios de sesión en otras pestañas
        detectSessionInUrl: true
      },
      realtime: {
        // Configuración de WebSockets para sincronización en tiempo real
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null

/**
 * Verifica la conexión a Supabase haciendo una query simple.
 * Útil para el indicador de estado de conexión.
 *
 * @returns true si la conexión funciona
 */
export const verificarConexionSupabase = async (): Promise<boolean> => {
  if (!supabase) return false
  try {
    const { error } = await supabase.auth.getSession()
    return !error
  } catch (e: unknown) {
    log.error('Error verificando conexión:', e)
    return false
  }
}

/**
 * Verifica si la app está online (F5-03).
 * Usa navigator.onLine como verificación rápida + ping a Supabase como fallback.
 *
 * @returns true si hay conexión operativa
 */
export const estaOnline = async (): Promise<boolean> => {
  // Verificación rápida
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false
  }

  // Si Supabase no está configurado, asumir online (modo localStorage)
  if (!USE_SUPABASE || !supabase) {
    return true
  }

  // Ping a Supabase como verificación robusta
  try {
    const { error } = await supabase.from('pacientes').select('id').limit(1)
    return !error
  } catch (e: unknown) {
    log.error('Error verificando conexión:', e)
    return false
  }
}
