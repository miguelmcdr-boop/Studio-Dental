/**
 * Persistencia aislada en LocalStorage para Arancel y Paquetes Clínicos
 */

const STORAGE_KEY_ARANCEL = 'clinica_arancel_prestaciones'
const STORAGE_KEY_PAQUETES = 'clinica_paquetes_clinicos_promos'

export const prestacionesStorageService = {
  obtenerPrestaciones: (defaults) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ARANCEL)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer arancel:', e)
      return defaults
    }
  },

  guardarPrestaciones: (prestaciones) => {
    try {
      localStorage.setItem(STORAGE_KEY_ARANCEL, JSON.stringify(prestaciones))
    } catch (e) {
      console.error('Error al guardar arancel:', e)
    }
  },

  obtenerPaquetes: (defaults) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAQUETES)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer paquetes clínicos:', e)
      return defaults
    }
  },

  guardarPaquetes: (paquetes) => {
    try {
      localStorage.setItem(STORAGE_KEY_PAQUETES, JSON.stringify(paquetes))
    } catch (e) {
      console.error('Error al guardar paquetes clínicos:', e)
    }
  }
}