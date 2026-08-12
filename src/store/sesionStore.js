import { create } from 'zustand'
import { esRolValido, obtenerRolPorDefecto } from '../services/rbacService'

const ACTIVE_USER_KEY = 'clinica_active_user'

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
    console.error('Error al leer la sesión activa:', e)
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
 */
export const useSesionStore = create((set) => ({
  userProfile: cargarPerfilActivo(),

  login: (profile) => {
    try {
      localStorage.setItem(ACTIVE_USER_KEY, profile.email)
    } catch (e) {
      console.error('Error al guardar la sesión activa:', e)
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

  logout: () => {
    try {
      localStorage.removeItem(ACTIVE_USER_KEY)
    } catch (e) {
      console.error('Error al cerrar la sesión:', e)
    }
    set({ userProfile: null })
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