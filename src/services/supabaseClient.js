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
import { createClient } from '@supabase/supabase-js'

// Cargar variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Feature flag para activar/desactivar Supabase (estrategia de reversibilidad)
export const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true'

/**
 * Valida que las variables de entorno estén configuradas correctamente.
 * Retorna true si Supabase está listo para usarse.
 */
export const isSupabaseConfigured = () => {
  if (!USE_SUPABASE) return false
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
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
export const supabase = isSupabaseConfigured()
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
 * @returns {Promise<boolean>} true si la conexión funciona
 */
export const verificarConexionSupabase = async () => {
  if (!supabase) return false
  try {
    const { error } = await supabase.auth.getSession()
    return !error
  } catch (e) {
    console.error('[supabaseClient] Error verificando conexión:', e)
    return false
  }
}