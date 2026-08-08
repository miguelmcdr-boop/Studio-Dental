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