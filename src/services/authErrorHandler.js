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

/**
 * Palabras clave que identifican errores de autenticación en mensajes de Supabase.
 * Supabase usa mensajes en inglés; se cubren las variantes más comunes.
 */
const AUTH_ERROR_PATTERNS = [
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
 * @param {Object|null} error - Objeto de error de Supabase
 * @returns {boolean} true si el error es de autenticación
 */
export const esErrorAutenticacion = (error) => {
  if (!error) return false

  // Códigos HTTP específicos de autenticación
  if (error.status === 401 || error.status === 403) return true

  // Código de error específico de Supabase
  if (error.code === 'PGRST301') return true // JWT expired en PostgREST

  // Buscar patrones en el mensaje
  const mensaje = (error.message || '').toLowerCase()
  return AUTH_ERROR_PATTERNS.some((pattern) =>
    mensaje.includes(pattern.toLowerCase())
  )
}

/**
 * Maneja un error de autenticación ejecutando logout forzado.
 * Loguea el error para trazabilidad antes de disparar el callback.
 *
 * @param {Object} error - Objeto de error de Supabase
 * @param {Function} onLogout - Callback para logout forzado (debe ser async)
 * @returns {Promise<boolean>} true si se ejecutó logout, false si el error no era de auth
 */
export const manejarErrorAuth = async (error, onLogout) => {
  if (!esErrorAutenticacion(error)) return false

  console.warn(
    '[authErrorHandler] Error de autenticación detectado, iniciando logout forzado:',
    error.message || error
  )

  if (typeof onLogout === 'function') {
    try {
      await onLogout()
    } catch (e) {
      console.error('[authErrorHandler] Error ejecutando logout forzado:', e)
    }
  }

  return true
}

/**
 * Wrapper para queries de Supabase con manejo automático de errores de auth.
 * Si la query falla con error de autenticación, ejecuta logout forzado.
 *
 * @param {Promise} queryPromise - Promesa de la query de Supabase
 * @param {Function} onLogout - Callback para logout forzado
 * @returns {Promise<Object>} Resultado de la query ({ data, error })
 */
export const conManejoAuth = async (queryPromise, onLogout) => {
  try {
    const resultado = await queryPromise
    if (resultado?.error && esErrorAutenticacion(resultado.error)) {
      await manejarErrorAuth(resultado.error, onLogout)
    }
    return resultado
  } catch (e) {
    if (esErrorAutenticacion(e)) {
      await manejarErrorAuth(e, onLogout)
    }
    throw e
  }
}
