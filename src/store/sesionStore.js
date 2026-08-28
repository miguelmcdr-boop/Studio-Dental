import { create } from 'zustand'
import { esRolValido, obtenerRolPorDefecto } from '../services/rbacService'
import { supabase, USE_SUPABASE } from '../services/supabaseClient'
import { createLogger } from '../services/logger'
import { purgarDatosLocales } from '../services/purgarDatosLocales'

const log = createLogger('sesionStore')

const ACTIVE_USER_KEY = 'clinica_active_user'

// F7-05 FIX: flag para prevenir recursión de logout.
// Cuando logout() llama a supabase.auth.signOut(), Supabase dispara el evento
// SIGNED_OUT que vuelve a invocar logout() desde los listeners de auth
// (useAuthStateListener, useSessionGuard). Este flag previene que se ejecute
// logout() recursivamente, evitando stack overflow y operaciones duplicadas.
let estaCerrandoSesion = false

/**
 * Carga el perfil activo desde localStorage y garantiza que tenga un rol válido.
 * Si el perfil existe pero no tiene rol válido (campo faltante o valor inválido),
 * se le asigna el rol por defecto (RECEPCION, fail-safe) en memoria.
 *
 * Nota: no modifica el perfil en localStorage — solo normaliza en memoria
 * para que el hook useRBAC tenga un rol válido garantizado.
 */
const cargarPerfilActivo = () => {
  try {
    const activeEmail = localStorage.getItem(ACTIVE_USER_KEY)
    if (!activeEmail) return null
    const saved = localStorage.getItem(`profile_${activeEmail}`)
    if (!saved) return null

    const perfil = JSON.parse(saved)

    // F3-05: garantizar que el perfil tenga un rol válido en memoria.
    // Si no tiene rol o es inválido, usar el rol por defecto (RECEPCION).
    if (!perfil.rol || !esRolValido(perfil.rol)) {
      return { ...perfil, rol: obtenerRolPorDefecto() }
    }

    return perfil
  } catch (e) {
    log.error('Error al leer la sesión activa:', e)
    return null
  }
}

/**
 * Store global de sesión/perfil de usuario (F2-01 — MASTER_ROADMAP).
 * Sustituye el useState(null) + useEffect de carga inicial que vivían en
 * App.jsx. La persistencia del perfil editado (ej. desde Configuración)
 * sigue ocurriendo donde ya ocurría (useConfiguracion.js) — este store no
 * la duplica, solo mantiene el estado en memoria y la sesión activa.
 *
 * F3-05: garantiza que el campo `rol` siempre esté presente y válido
 * en el userProfile en memoria, con fallback seguro a RECEPCION.
 *
 * F4-02c-3: logout() ahora cierra AMBAS sesiones:
 * - Sesión local (localStorage)
 * - Sesión de Supabase Auth (cuando VITE_USE_SUPABASE=true)
 * Esto previene el bug donde el useEffect de App.jsx restaura la sesión
 * inmediatamente después del logout porque Supabase Auth sigue activo.
 */
export const useSesionStore = create((set) => ({
  userProfile: cargarPerfilActivo(),

  login: (profile) => {
    try {
      localStorage.setItem(ACTIVE_USER_KEY, profile.email)
      
      // F4-02b FIX: En modo Supabase, también guardar el perfil completo
      // en localStorage para que persista entre recargas.
      // Sin esto, al recargar en incógnito, cargarPerfilActivo() no encuentra
      // el perfil y muestra LoginScreen.
      if (profile.supabaseAuth) {
        const profileKey = `profile_${profile.email.trim().toLowerCase()}`
        localStorage.setItem(profileKey, JSON.stringify(profile))
      }
    } catch (e) {
      log.error('Error al guardar la sesión activa:', e)
    }

    // F3-05: garantizar rol válido en memoria. Si el perfil entrante no
    // tiene rol válido, asignar el rol por defecto (RECEPCION).
    const perfilNormalizado = {
      ...profile,
      rol: profile.rol && esRolValido(profile.rol)
        ? profile.rol
        : obtenerRolPorDefecto()
    }

    set({ userProfile: perfilNormalizado })
  },

  logout: async () => {
    // F7-05 FIX: prevenir recursión de logout
    // Si ya estamos cerrando sesión, no hacer nada (evita stack overflow
    // cuando los listeners de Supabase vuelven a llamar logout).
    if (estaCerrandoSesion) {
      log.warn('Logout ya está en progreso, ignorando llamada recursiva')
      return
    }

    estaCerrandoSesion = true

    try {
      // 1. Cerrar sesión de Supabase Auth (si está activa) PRIMERO
      // F4-02c-3: esto previene que el useEffect de App.jsx restaure la sesión
      // inmediatamente después del logout porque detecta session activa.
      if (USE_SUPABASE && supabase) {
        try {
          await supabase.auth.signOut()
          log.info('Sesión de Supabase Auth cerrada')
        } catch (e) {
          log.error('Error al cerrar sesión de Supabase:', e)
        }
      }

      // 2. F7-05: purgar todas las capas de persistencia local (stores Zustand,
      // localStorage, IndexedDB de adjuntos, Cache Storage del Service Worker).
      // Fail-safe: cada paso es independiente y no aborta si uno falla.
      try {
        await purgarDatosLocales({ logger: log })
      } catch (e) {
        log.error('Error durante la purga de datos locales (F7-05):', e)
      }

      // 3. Limpiar estado de sesión en memoria (el resto ya se limpió en paso 2)
      set({ userProfile: null })
    } finally {
      // Siempre liberar el flag, incluso si hay error
      estaCerrandoSesion = false
    }
  },

  // Actualiza el perfil en memoria sin tocar localStorage — quien llama
  // (ej. useConfiguracion.js) ya se encarga de persistir.
  // F3-05: preserva la normalización del rol si viene uno nuevo.
  actualizarPerfil: (profile) => {
    const perfilNormalizado = {
      ...profile,
      rol: profile.rol && esRolValido(profile.rol)
        ? profile.rol
        : obtenerRolPorDefecto()
    }
    set({ userProfile: perfilNormalizado })
  }
}))
