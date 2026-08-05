/**
 * Servicio de Persistencia Offline para Odontogramas
 */

export const odontogramaStorageService = {
  obtenerOdontograma: (key, fallback = {}) => {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : fallback
    } catch (e) {
      console.error('Error al leer odontograma:', e)
      return fallback
    }
  },

  guardarOdontograma: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      console.error('Error al guardar odontograma:', e)
    }
  }
}