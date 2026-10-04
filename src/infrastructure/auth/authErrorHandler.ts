/**
 * Servicio de manejo de errores de autenticación (F6-H).
 *
 * Detecta errores de Supabase relacionados con autenticación (JWT expirado,
 * refresh fallido, sesión inválida) y permite ejecutar logout forzado.
 *
 * Uso:
 *   const { data, error } = await supabase.from('pacientes').select('*')
 *   if (error && esErrorAutenticacion(error)) {
 *     manejarErrorAuth(error, () => sesionStore.logout())
 *     return
 *   }
 */

import { createLogger } from '../logging/logger'

export interface AuthErrorLike {
  status?: number
  code?: string
  message?: string
  [key: string]: unknown
}

const log = createLogger('authErrorHandler')

/**
 * Palabras clave que identifican errores de autenticación en mensajes de Supabase.
 * Supabase usa mensajes en inglés; se cubren las variantes más comunes.
 */
const AUTH_ERROR_PATTERNS: readonly string[] = [
  'jwt expired',
  'jwt Expired',
  'token has expired',
  'token is expired',
  'invalid jwt',
  'invalid token',
  'jwt malformed',
  'jwt signature',
  'refresh_token_not_found',
  'refresh token not found',
  'invalid refresh token',
  'session_not_found',
  'session not found',
  'auth session missing',
  'auth session expired',
  'user not found',
  'email not confirmed',
  '401',
  '403'
]

/**
 * Determina si un error de Supabase está relacionado con autenticación.
 *
 * @param error - Objeto de error de Supabase
 * @returns true si el error es de autenticación
 */
export const esErrorAutenticacion = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false

  const err = error as AuthErrorLike

  // Códigos HTTP específicos de autenticación
  if (err.status === 401 || err.status === 403) return true

  // Código de error específico de Supabase
  if (err.code === 'PGRST301') return true // JWT expired en PostgREST

  // Buscar patrones en el mensaje
  const mensaje = (typeof err.message === 'string' ? err.message : '').toLowerCase()
  return AUTH_ERROR_PATTERNS.some((pattern) =>
    mensaje.includes(pattern.toLowerCase())
  )
}

/**
 * Maneja un error de autenticación ejecutando logout forzado.
 * Loguea el error para trazabilidad antes de disparar el callback.
 *
 * @param error - Objeto de error de Supabase
 * @param onLogout - Callback para logout forzado (debe ser async o sync)
 * @returns true si se ejecutó logout, false si el error no era de auth
 */
export const manejarErrorAuth = async (
  error: unknown,
  onLogout?: (() => Promise<void> | void) | null
): Promise<boolean> => {
  if (!esErrorAutenticacion(error)) return false

  const err = error as AuthErrorLike
  log.warn(
    '[authErrorHandler] Error de autenticación detectado, iniciando logout forzado:',
    err?.message || error
  )

  if (typeof onLogout === 'function') {
    try {
      await onLogout()
    } catch (e: unknown) {
      log.error('Error ejecutando logout forzado:', e)
    }
  }

  return true
}

/**
 * Wrapper para queries de Supabase con manejo automático de errores de auth.
 * Si la query falla con error de autenticación, ejecuta logout forzado.
 *
 * @param queryPromise - Promesa de la query de Supabase
 * @param onLogout - Callback para logout forzado
 * @returns Resultado de la query ({ data, error })
 */
export const conManejoAuth = async <T extends { error?: unknown }>(
  queryPromise: Promise<T>,
  onLogout?: (() => Promise<void> | void) | null
): Promise<T> => {
  try {
    const resultado = await queryPromise
    if (resultado?.error && esErrorAutenticacion(resultado.error)) {
      await manejarErrorAuth(resultado.error, onLogout)
    }
    return resultado
  } catch (e: unknown) {
    if (esErrorAutenticacion(e)) {
      await manejarErrorAuth(e, onLogout)
    }
    throw e
  }
}
