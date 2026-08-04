/**
 * Persistencia aislada en LocalStorage para Finanzas, Convenios y Cierres de Caja
 */

const STORAGE_KEY_MOVIMIENTOS = 'studio_dental_finanzas_movimientos'
const STORAGE_KEY_CONVENIOS = 'studio_dental_finanzas_convenios'
const STORAGE_KEY_CIERRES = 'studio_dental_finanzas_cierres_caja'

export const finanzasStorageService = {
  // Movimientos (Ingresos / Egresos)
  obtenerMovimientos: (defaults = []) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer movimientos de finanzas:', e)
      return defaults
    }
  },

  guardarMovimientos: (movs) => {
    try {
      localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(movs))
    } catch (e) {
      console.error('Error al guardar movimientos de finanzas:', e)
    }
  },

  // Convenios e Isapres
  obtenerConvenios: (defaults = []) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONVENIOS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer convenios de finanzas:', e)
      return defaults
    }
  },

  guardarConvenios: (convenios) => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVENIOS, JSON.stringify(convenios))
    } catch (e) {
      console.error('Error al guardar convenios de finanzas:', e)
    }
  },

  // Cierres y Arqueos de Caja
  obtenerCierresCaja: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CIERRES)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Error al leer cierres de caja:', e)
      return []
    }
  },

  guardarCierresCaja: (cierres) => {
    try {
      localStorage.setItem(STORAGE_KEY_CIERRES, JSON.stringify(cierres))
    } catch (e) {
      console.error('Error al guardar cierres de caja:', e)
    }
  }
}