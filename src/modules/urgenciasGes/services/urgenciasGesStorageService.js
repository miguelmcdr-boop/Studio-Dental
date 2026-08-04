/**
 * Persistencia en LocalStorage para Urgencias y Notificaciones GES
 */

const STORAGE_KEY_GES = 'studio_dental_atenciones_ges_urgencias'

export const urgenciasGesStorageService = {
  obtenerAtenciones: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GES)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Error al leer atenciones GES:', e)
      return []
    }
  },

  guardarAtenciones: (atenciones) => {
    try {
      localStorage.setItem(STORAGE_KEY_GES, JSON.stringify(atenciones))
    } catch (e) {
      console.error('Error al guardar atenciones GES:', e)
    }
  }
}