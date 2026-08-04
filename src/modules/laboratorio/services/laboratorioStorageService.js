/**
 * Persistencia en LocalStorage para Órdenes y Directorio de Laboratorios
 */

const STORAGE_KEY_ORDENES = 'studio_dental_laboratorio_ordenes'
const STORAGE_KEY_LABS = 'studio_dental_laboratorio_directorio'

export const laboratorioStorageService = {
  obtenerOrdenes: (defaults) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDENES)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer órdenes de laboratorio:', e)
      return defaults
    }
  },

  guardarOrdenes: (ordenes) => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDENES, JSON.stringify(ordenes))
    } catch (e) {
      console.error('Error al guardar órdenes de laboratorio:', e)
    }
  },

  obtenerLaboratorios: (defaults) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LABS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer directorio de laboratorios:', e)
      return defaults
    }
  },

  guardarLaboratorios: (labs) => {
    try {
      localStorage.setItem(STORAGE_KEY_LABS, JSON.stringify(labs))
    } catch (e) {
      console.error('Error al guardar directorio de laboratorios:', e)
    }
  }
}