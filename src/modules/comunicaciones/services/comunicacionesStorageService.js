/**
 * Persistencia aislada para Comunicaciones, Bitácora y Plantillas
 */

const STORAGE_KEY_PLANTILLAS = 'studio_dental_comunicaciones_plantillas_v3'
const STORAGE_KEY_HISTORIAL = 'studio_dental_comunicaciones_historial_v3'

export const comunicacionesStorageService = {
  obtenerPlantillas: (defaults = []) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLANTILLAS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer plantillas:', e)
      return defaults
    }
  },

  guardarPlantillas: (plantillas) => {
    try {
      localStorage.setItem(STORAGE_KEY_PLANTILLAS, JSON.stringify(plantillas))
    } catch (e) {
      console.error('Error al guardar plantillas:', e)
    }
  },

  obtenerHistorial: (defaults = []) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORIAL)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer historial de comunicaciones:', e)
      return defaults
    }
  },

  guardarHistorial: (historial) => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(historial))
    } catch (e) {
      console.error('Error al guardar historial:', e)
    }
  }
}