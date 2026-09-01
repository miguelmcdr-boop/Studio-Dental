import { supabase, USE_SUPABASE } from './supabaseClient'
import { createLogger } from './logger'

const log = createLogger('authService')
/**
 * Servicio de Autenticación — Studio Dental
 * Tarea MASTER_ROADMAP: F1-01
 *
 * Hashing de contraseñas con PBKDF2 vía Web Crypto API (nativa del
 * navegador, sin dependencia externa). Nunca se persiste una contraseña
 * en texto plano — solo `{ salt, hash, iterations }`.
 *
 * Incluye un mecanismo simple de bloqueo por intentos fallidos, para
 * mitigar fuerza bruta local contra el localStorage del navegador.
 */

const PBKDF2_ITERATIONS = 100000
const HASH_ALGORITHM = 'SHA-256'
const SALT_LENGTH_BYTES = 16
const DERIVED_KEY_LENGTH_BITS = 256

export const MAX_INTENTOS_FALLIDOS = 5
const BLOQUEO_DURACION_MS = 5 * 60 * 1000 // 5 minutos

const toBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
const fromBase64 = (base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

const generarSalt = () => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES))
  return toBase64(salt)
}

const derivarHash = async (password, saltBase64, iterations = PBKDF2_ITERATIONS) => {
  const enc = new TextEncoder()
  const salt = fromBase64(saltBase64)
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: HASH_ALGORITHM },
    keyMaterial,
    DERIVED_KEY_LENGTH_BITS
  )
  return toBase64(derivedBits)
}

/**
 * Crea una credencial hasheada a partir de una contraseña en texto plano.
 * El resultado es lo único que debe persistirse en el perfil del usuario.
 */
export const crearCredencial = async (password) => {
  const salt = generarSalt()
  const hash = await derivarHash(password, salt)
  return { salt, hash, iterations: PBKDF2_ITERATIONS }
}

/**
 * Verifica una contraseña en texto plano contra una credencial hasheada.
 * Retorna false (nunca lanza) si la credencial está incompleta o corrupta.
 */
export const verificarPassword = async (password, credencial) => {
  if (!credencial?.salt || !credencial?.hash) return false
  try {
    const hashIntento = await derivarHash(password, credencial.salt, credencial.iterations || PBKDF2_ITERATIONS)
    return hashIntento === credencial.hash
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Bloqueo por intentos fallidos
// ---------------------------------------------------------------------------
const attemptsKey = (email) => `login_attempts_${email}`

const obtenerEstadoIntentos = (email) => {
  try {
    const raw = localStorage.getItem(attemptsKey(email))
    return raw ? JSON.parse(raw) : { count: 0, lockedUntil: null }
  } catch {
    return { count: 0, lockedUntil: null }
  }
}

/**
 * Indica si un email está actualmente bloqueado por exceso de intentos fallidos.
 */
export const estaBloqueado = (email) => {
  const estado = obtenerEstadoIntentos(email)
  if (estado.lockedUntil && Date.now() < estado.lockedUntil) {
    return { bloqueado: true, restanteMs: estado.lockedUntil - Date.now() }
  }
  return { bloqueado: false, restanteMs: 0 }
}

/**
 * Registra un intento de login fallido para un email. Al alcanzar
 * MAX_INTENTOS_FALLIDOS, bloquea el email por BLOQUEO_DURACION_MS.
 */
export const registrarIntentoFallido = (email) => {
  const estado = obtenerEstadoIntentos(email)
  const nuevoCount = estado.count + 1
  const nuevoEstado = {
    count: nuevoCount,
    lockedUntil: nuevoCount >= MAX_INTENTOS_FALLIDOS ? Date.now() + BLOQUEO_DURACION_MS : null
  }
  localStorage.setItem(attemptsKey(email), JSON.stringify(nuevoEstado))
  return nuevoEstado
}

/**
 * Limpia el contador de intentos fallidos de un email (login exitoso).
 */
export const limpiarIntentosFallidos = (email) => {
  localStorage.removeItem(attemptsKey(email))
}

// ---------------------------------------------------------------------------
// Gestión de perfiles de usuario (F2-07c)
// ---------------------------------------------------------------------------
//
// Centraliza el acceso a la clave `profile_${email}` en localStorage.
// Antes, LoginScreen y useConfiguracion accedían directamente a esta clave,
// violando el criterio de F2-07 de "cero accesos directos fuera de servicios".
//
// Nota: estos accesos son al dominio de sesión/perfil, por lo que el
// authService es el dueño natural de la clave — no se crea un servicio
// separado, se extiende este.

const profileKey = (email) => `profile_${email.trim().toLowerCase()}`

/**
 * Lee el perfil de usuario persistido para un email dado.
 * @param {string} email - Email del profesional (se normaliza a minúsculas).
 * @returns {object|null} El perfil parseado, o `null` si no existe o el JSON
 *   está corrupto. Nunca lanza excepción (Cap. VII.4 de la Constitución).
 */
export const obtenerPerfil = (email) => {
  if (!email) return null
  try {
    const raw = localStorage.getItem(profileKey(email))
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    log.error(`Error al leer perfil "${email}" desde localStorage:`, e)
    return null
  }
}

/**
 * Persiste el perfil de usuario para un email dado.
 * @param {string} email - Email del profesional (se normaliza a minúsculas).
 * @param {object} perfil - Objeto de perfil completo a persistir.
 * @returns {boolean} `true` si la escritura fue exitosa, `false` si falló
 *   (ej. localStorage lleno). Nunca lanza excepción.
 */
export const guardarPerfil = (email, perfil) => {
  if (!email || !perfil) return false
  try {
    localStorage.setItem(profileKey(email), JSON.stringify(perfil))
    return true
  } catch (e) {
    log.error(`Error al guardar perfil "${email}" en localStorage:`, e)
    return false
  }
}

/**
 * Indica si existe un perfil persistido para un email dado.
 * Útil para la UI de LoginScreen que necesita saber si es primera vez
 * sin cargar el perfil completo.
 * @param {string} email
 * @returns {boolean}
 */
export const existePerfil = (email) => {
  if (!email) return false
  try {
    return localStorage.getItem(profileKey(email)) !== null
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Integración con Supabase Auth (F4-02b)
// ---------------------------------------------------------------------------
// Estas funciones delegan a Supabase Auth cuando VITE_USE_SUPABASE=true.
// El hook useAuth.js y LoginScreen.jsx las usan internamente.

/**
 * Iniciar sesión con Supabase Auth.
 * F6-C-d.2: Consulta miembros_clinica post-login para obtener clinica_id y rol
 * autoritativo (RFC §4.6). Fail-safe a app_metadata si la query falla.
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<{success: boolean, error?: string, userMetadata?: object}>}
 */
export const supabaseSignIn = async (email, password) => {
  if (!USE_SUPABASE || !supabase) {
    return { success: false, error: 'Supabase no configurado' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // F4-02b FIX DEFINITIVO: obtener user_metadata con getUser() DESPUÉS
  // del signIn exitoso. Esto garantiza que la metadata esté disponible
  // (signInWithPassword a veces no la incluye inmediatamente en la respuesta).
  const { data: { user } } = await supabase.auth.getUser()

  // F6-B4: leer rol de app_metadata (JWT firmado, no editable por el usuario)
  const appRole = user?.app_metadata?.role || 'recepcion'
  
  // F6-C-d.2: Consultar miembros_clinica para obtener clinica_id y rol autoritativo
  let clinicaId = null
  let rolDesdeMiembros = null
  
  if (user?.id) {
    try {
      const { data: membresia, error: errorMembresia } = await supabase
        .from('miembros_clinica')
        .select('clinica_id, rol')
        .eq('user_id', user.id)
        .eq('activo', true)
        .single()
      
      if (!errorMembresia && membresia) {
        clinicaId = membresia.clinica_id
        rolDesdeMiembros = membresia.rol
      } else {
        log.warn(`No se encontró membresía activa para user ${user.id}, usando app_metadata como fallback`)
      }
    } catch (err) {
      log.error('Error consultando miembros_clinica:', err)
    }
  }
  
  // D37: Fail-safe — si la query falló, usar app_metadata.role
  const rolFinal = rolDesdeMiembros || appRole
  
  const userMetadata = { 
    ...(user?.user_metadata || {}), 
    role: rolFinal,
    clinicaId: clinicaId  // F6-C-d.2: propagar clinicaId al perfil
  }

  return {
    success: true,
    userMetadata
  }
}

/**
 * Registrar nuevo usuario con Supabase Auth.
 * F6-C-d.2: NO consulta miembros_clinica (D38 — usuario nuevo no tiene membresía).
 * El admin la asigna después (flujo híbrido RFC Decisión #1).
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña en texto plano
 * @param {object} metadata - Datos adicionales (nombreCompleto, rol, etc.)
 * @returns {Promise<{success: boolean, error?: string, userMetadata?: object}>}
 */
export const supabaseSignUp = async (email, password, metadata = {}) => {
  if (!USE_SUPABASE || !supabase) {
    return { success: false, error: 'Supabase no configurado' }
  }

  // F7-09: NO enviar rol en metadata. handle_new_user() ignora rol del cliente
  // por seguridad y asigna 'recepcion' por defecto. El rol real se asignará
  // vía miembros_clinica (F7-11).
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: metadata.nombreCompleto || 'Usuario',
        // F7-09: role eliminado para prevenir escalamiento de privilegios
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // F6-B4 + F7-09: leer rol de app_metadata (siempre 'recepcion' por defecto)
  const { data: { user } } = await supabase.auth.getUser()
  const appRole = user?.app_metadata?.role || 'recepcion'
  const userMetadata = { ...(user?.user_metadata || {}), role: appRole }

  return {
    success: true,
    userMetadata
  }
}

/**
 * F7-09: Obtiene el rol del usuario con lógica fail-closed.
 * 
 * Si falla la consulta de membresía o el rol no es válido,
 * degrada a 'recepcion' (rol no privilegiado), nunca a 'admin'.
 * 
 * @param {string} userId - ID del usuario autenticado
 * @param {object} [supabaseClient] - Cliente Supabase (default: supabase global)
 * @returns {Promise<string>} Rol del usuario (fallback garantizado a 'recepcion')
 */
export const obtenerRolConFailClosed = async (userId, supabaseClient = supabase) => {
  const ROL_FALLBACK = 'recepcion'
  const ROLES_VALIDOS = ['admin', 'dentista', 'asistente', 'recepcion']

  if (!userId) {
    log.warn('F7-09: userId vacío, degradando a recepcion')
    return ROL_FALLBACK
  }

  if (!supabaseClient) {
    log.warn('F7-09: supabaseClient no disponible, degradando a recepcion')
    return ROL_FALLBACK
  }

  try {
    const { data, error } = await supabaseClient
      .from('miembros_clinica')
      .select('rol')
      .eq('user_id', userId)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      log.warn('F7-09: Error consultando membresía, degradando a recepcion:', error.message)
      return ROL_FALLBACK
    }

    if (!data) {
      log.info('F7-09: Usuario sin membresía activa, degradando a recepcion')
      return ROL_FALLBACK
    }

    if (!ROLES_VALIDOS.includes(data.rol)) {
      log.warn('F7-09: Rol inválido detectado:', data.rol, '- degradando a recepcion')
      return ROL_FALLBACK
    }

    return data.rol
  } catch (error) {
    log.error('F7-09: Excepción en obtenerRolConFailClosed, degradando a recepcion:', error.message)
    return ROL_FALLBACK
  }
}

/**
 * Cerrar sesión con Supabase Auth.
 * @returns {Promise<void>}
 */
export const supabaseSignOut = async () => {
  if (!USE_SUPABASE || !supabase) {
    return
  }
  await supabase.auth.signOut()
}

/**
 * F7-10: Establece la clínica activa del usuario.
 *
 * Actualiza user_metadata.clinica_id y recarga la sesión para que el JWT
 * incluya el nuevo valor. clinica_actual() (server-side) leerá este selector.
 *
 * @param {string} clinicaId - UUID de la clínica a activar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setClinicaActiva = async (clinicaId) => {
  if (!USE_SUPABASE || !supabase) {
    return { success: false, error: 'Supabase no configurado' }
  }

  if (!clinicaId) {
    return { success: false, error: 'clinicaId requerido' }
  }

  try {
    const { error } = await supabase.auth.updateUser({
      data: { clinica_id: clinicaId }
    })

    if (error) {
      log.error('F7-10: Error actualizando clinica_id:', error.message)
      return { success: false, error: error.message }
    }

    // Forzar refresh del JWT para que incluya el nuevo clinica_id
    const { data, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      log.warn('F7-10: No se pudo refrescar sesión:', refreshError.message)
    } else if (data.session) {
      log.info('F7-10: JWT refrescado, clinica_id en user_metadata:', 
        data.session.user.user_metadata?.clinica_id)
    }

    log.info('F7-10: Clínica activa establecida:', clinicaId)
    return { success: true }
  } catch (error) {
    log.error('F7-10: Excepción en setClinicaActiva:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * F7-10: Obtiene la clínica activa del usuario desde user_metadata.
 *
 * @returns {string|null} UUID de la clínica activa, o null si no está seteada
 */
export const getClinicaActiva = async () => {
  if (!USE_SUPABASE || !supabase) return null

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    return user.user_metadata?.clinica_id || null
  } catch (error) {
    log.error('F7-10: Error en getClinicaActiva:', error.message)
    return null
  }
}

/**
 * F7-10: Lista las clínicas donde el usuario tiene membresía activa.
 *
 * @returns {Promise<Array<{clinica_id: string, nombre: string, rol: string}>>}
 */
export const listarMisClinicas = async () => {
  if (!USE_SUPABASE || !supabase) return []

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('miembros_clinica')
      .select('clinica_id, rol, clinicas(nombre)')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('clinica_id')

    if (error) {
      log.error('F7-10: Error listando clínicas:', error.message)
      return []
    }

    return (data || []).map(m => ({
      clinica_id: m.clinica_id,
      nombre: m.clinicas?.nombre || 'Clínica',
      rol: m.rol
    }))
  } catch (error) {
    log.error('F7-10: Excepción en listarMisClinicas:', error.message)
    return []
  }
}

/**
 * F7-10b: Obtiene el rol del usuario en la clínica activa actual.
 *
 * Consulta miembros_clinica filtrada por clinica_actual() para obtener
 * el rol contextual (no el rol global de user_metadata).
 *
 * @returns {Promise<string|null>} Rol en la clínica activa, o null si no tiene membresía
 */
export const obtenerRolEnClinicaActual = async () => {
  if (!USE_SUPABASE || !supabase) return null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Query a miembros_clinica filtrada por la clínica activa
    const { data, error } = await supabase.rpc('clinica_actual').then(async ({ data: clinicaId }) => {
      if (!clinicaId) return { data: null, error: null }

      const { data: membresia, error: membresiaError } = await supabase
        .from('miembros_clinica')
        .select('rol')
        .eq('user_id', user.id)
        .eq('clinica_id', clinicaId)
        .eq('activo', true)
        .single()

      return { data: membresia, error: membresiaError }
    })

    if (error) {
      log.warn('F7-10b: Error consultando rol contextual:', error.message)
      return null
    }

    return data?.rol || null
  } catch (error) {
    log.error('F7-10b: Excepción en obtenerRolEnClinicaActual:', error.message)
    return null
  }
}

// ============================================================
// F7-11: Gestión de invitaciones de miembros (sin service_role)
// ============================================================

/**
 * F7-11: Invita a un nuevo miembro a la clínica activa.
 * Solo admins de la clínica activa pueden invitar.
 *
 * @param {string} email - Email del invitado
 * @param {string} rol - Rol a asignar: 'admin' | 'dentista' | 'asistente' | 'recepcion'
 * @returns {Promise<{success: boolean, invitacionId?: string, error?: string}>}
 */
export const invitarMiembro = async (email, rol) => {
  if (!USE_SUPABASE || !supabase) {
    return { success: false, error: 'Supabase no configurado' }
  }

  try {
    // Validaciones de entrada
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: false, error: 'Email inválido' }
    }

    const rolesValidos = ['admin', 'dentista', 'asistente', 'recepcion']
    if (!rol || !rolesValidos.includes(rol)) {
      return { success: false, error: `Rol inválido: ${rol}` }
    }

    // Llamar RPC (SECURITY DEFINER, valida permisos internamente)
    const { data, error } = await supabase.rpc('invitar_miembro', {
      p_email: email.trim().toLowerCase(),
      p_rol: rol
    })

    if (error) {
      log.error('F7-11: Error invitando miembro:', error.message)
      // Traducir errores conocidos
      if (error.message.includes('PERMISO_DENEGADO')) {
        return { success: false, error: 'Solo administradores pueden invitar miembros' }
      }
      if (error.message.includes('ya es miembro activo')) {
        return { success: false, error: 'Este email ya es miembro de la clínica' }
      }
      return { success: false, error: error.message }
    }

    log.info('F7-11: Invitación creada:', { email, rol, id: data })
    return { success: true, invitacionId: data }
  } catch (error) {
    log.error('F7-11: Excepción en invitarMiembro:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * F7-11: Lista invitaciones de la clínica activa (admin) o del propio email (otros roles).
 *
 * @returns {Promise<{success: boolean, invitaciones?: Array, error?: string}>}
 */
export const listarInvitaciones = async () => {
  if (!USE_SUPABASE || !supabase) {
    return { success: false, error: 'Supabase no configurado' }
  }

  try {
    const { data, error } = await supabase.rpc('listar_invitaciones_clinica')

    if (error) {
      log.error('F7-11: Error listando invitaciones:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, invitaciones: data || [] }
  } catch (error) {
    log.error('F7-11: Excepción en listarInvitaciones:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * F7-11: Lista miembros actuales de la clínica activa.
 * Consulta miembros_clinica JOIN auth.users para obtener emails.
 *
 * @returns {Promise<{success: boolean, miembros?: Array, error?: string}>}
 */
export const listarMiembros = async () => {
  if (!USE_SUPABASE || !supabase) {
    return { success: false, error: 'Supabase no configurado' }
  }

  try {
    const clinicaId = await getClinicaActiva()
    
    if (!clinicaId) {
      return { success: false, error: 'No hay clínica activa' }
    }

    const { data, error } = await supabase
      .from('miembros_clinica')
      .select(`
        id,
        user_id,
        rol,
        activo,
        fecha_invitacion,
        invitado_por,
        users:user_id (email)
      `)
      .eq('clinica_id', clinicaId)
      .order('fecha_invitacion', { ascending: false })

    if (error) {
      log.error('F7-11: Error listando miembros:', error.message)
      return { success: false, error: error.message }
    }

    // Transformar para incluir email de auth.users
    const miembros = (data || []).map(m => ({
      id: m.id,
      user_id: m.user_id,
      email: m.users?.email || 'N/A',
      rol: m.rol,
      activo: m.activo,
      fecha_invitacion: m.fecha_invitacion,
      invitado_por: m.invitado_por
    }))

    return { success: true, miembros }
  } catch (error) {
    log.error('F7-11: Excepción en listarMiembros:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * F7-11: Revoca una invitación pendiente.
 * Solo admins de la clínica de la invitación pueden revocar.
 *
 * @param {string} invitacionId - UUID de la invitación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const revocarInvitacion = async (invitacionId) => {
  if (!USE_SUPABASE || !supabase) {
    return { success: false, error: 'Supabase no configurado' }
  }

  try {
    if (!invitacionId) {
      return { success: false, error: 'ID de invitación requerido' }
    }

    const { data, error } = await supabase.rpc('revocar_invitacion', {
      p_invitacion_id: invitacionId
    })

    if (error) {
      log.error('F7-11: Error revocando invitación:', error.message)
      if (error.message.includes('PERMISO_DENEGADO')) {
        return { success: false, error: 'Solo administradores pueden revocar invitaciones' }
      }
      return { success: false, error: error.message }
    }

    log.info('F7-11: Invitación revocada:', invitacionId)
    return { success: true }
  } catch (error) {
    log.error('F7-11: Excepción en revocarInvitacion:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * F7-11: Acepta una invitación con token.
 * Valida que el email del usuario autenticado coincida con la invitación.
 *
 * @param {string} token - Token único de la invitación
 * @returns {Promise<{success: boolean, clinicaId?: string, error?: string}>}
 */
export const aceptarInvitacion = async (token) => {
  if (!USE_SUPABASE || !supabase) {
    return { success: false, error: 'Supabase no configurado' }
  }

  try {
    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Token inválido' }
    }

    const { data, error } = await supabase.rpc('aceptar_invitacion', {
      p_token: token
    })

    if (error) {
      log.error('F7-11: Error aceptando invitación:', error.message)
      // Traducir errores conocidos
      if (error.message.includes('INVITACION_NO_ENCONTRADA')) {
        return { success: false, error: 'Invitación no encontrada' }
      }
      if (error.message.includes('INVITACION_EXPIRADA')) {
        return { success: false, error: 'Esta invitación ya expiró' }
      }
      if (error.message.includes('INVITACION_NO_VALIDA')) {
        return { success: false, error: 'Esta invitación ya fue procesada' }
      }
      if (error.message.includes('EMAIL_NO_COINCIDE')) {
        return { success: false, error: 'Esta invitación es para otro email. Inicia sesión con el email correcto.' }
      }
      if (error.message.includes('YA_ES_MIEMBRO')) {
        return { success: false, error: 'Ya eres miembro de esta clínica' }
      }
      return { success: false, error: error.message }
    }

    log.info('F7-11: Invitación aceptada. Clinica ID:', data)
    return { success: true, clinicaId: data }
  } catch (error) {
    log.error('F7-11: Excepción en aceptarInvitacion:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * F7-11: Genera URL de invitación para compartir.
 *
 * @param {string} token - Token de la invitación
 * @returns {string} URL completa para aceptar la invitación
 */
export const generarUrlInvitacion = (token) => {
  const baseUrl = window.location.origin
  return `${baseUrl}/#/aceptar-invita?token=${encodeURIComponent(token)}`
}
