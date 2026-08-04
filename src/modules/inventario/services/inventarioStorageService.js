/**
 * Persistencia aislada en LocalStorage para Inventario
 */

const STORAGE_KEY_INVENTARIO = 'studio_dental_inventario_stock'

export const inventarioStorageService = {
  obtenerItems: (defaults) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVENTARIO)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer inventario de localStorage:', e)
      return defaults
    }
  },

  guardarItems: (items) => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTARIO, JSON.stringify(items))
    } catch (e) {
      console.error('Error al guardar inventario en localStorage:', e)
    }
  }
}