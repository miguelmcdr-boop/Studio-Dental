import { supabase, USE_SUPABASE } from './supabaseClient'
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
    console.error(`Error al leer perfil "${email}" desde localStorage:`, e)
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
    console.error(`Error al guardar perfil "${email}" en localStorage:`, e)
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
        console.warn(`[authService] No se encontró membresía activa para user ${user.id}, usando app_metadata como fallback`)
      }
    } catch (err) {
      console.error('[authService] Error consultando miembros_clinica:', err)
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

  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: metadata.nombreCompleto || 'Usuario',
        role: metadata.rol || 'recepcion',
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // F6-B4: leer rol de app_metadata (propagado por trigger on_auth_user_created)
  const { data: { user } } = await supabase.auth.getUser()
  const appRole = user?.app_metadata?.role || 'recepcion'
  const userMetadata = { ...(user?.user_metadata || {}), role: appRole }

  return {
    success: true,
    userMetadata
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