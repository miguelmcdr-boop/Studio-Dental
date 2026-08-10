import { create } from 'zustand'

const ACTIVE_USER_KEY = 'clinica_active_user'

const cargarPerfilActivo = () => {
  try {
    const activeEmail = localStorage.getItem(ACTIVE_USER_KEY)
    if (!activeEmail) return null
    const saved = localStorage.getItem(`profile_${activeEmail}`)
    return saved ? JSON.parse(saved) : null
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
 */
export const useSesionStore = create((set) => ({
  userProfile: cargarPerfilActivo(),

  login: (profile) => {
    try {
      localStorage.setItem(ACTIVE_USER_KEY, profile.email)
    } catch (e) {
      console.error('Error al guardar la sesión activa:', e)
    }
    set({ userProfile: profile })
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
  actualizarPerfil: (profile) => set({ userProfile: profile })
}))