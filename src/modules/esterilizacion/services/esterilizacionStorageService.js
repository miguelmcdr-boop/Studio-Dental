/**
 * Persistencia aislada en LocalStorage para Esterilización (Cargas, Biológicos y Test Diarios)
 */

const STORAGE_KEY_CARGAS = 'studio_dental_esterilizacion_cargas'
const STORAGE_KEY_BIOLOGICOS = 'studio_dental_esterilizacion_biologicos'
const STORAGE_KEY_TEST_DIARIOS = 'studio_dental_esterilizacion_test_diarios'

export const esterilizacionStorageService = {
  obtenerCargas: (defaults) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARGAS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer cargas de esterilización:', e)
      return defaults
    }
  },

  guardarCargas: (cargas) => {
    try {
      localStorage.setItem(STORAGE_KEY_CARGAS, JSON.stringify(cargas))
    } catch (e) {
      console.error('Error al guardar cargas de esterilización:', e)
    }
  },

  obtenerBiologicos: (defaults) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BIOLOGICOS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer biológicos de esterilización:', e)
      return defaults
    }
  },

  guardarBiologicos: (biologicos) => {
    try {
      localStorage.setItem(STORAGE_KEY_BIOLOGICOS, JSON.stringify(biologicos))
    } catch (e) {
      console.error('Error al guardar biológicos de esterilización:', e)
    }
  },

  obtenerTestDiarios: (defaults) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEST_DIARIOS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer test diarios de esterilización:', e)
      return defaults
    }
  },

  guardarTestDiarios: (tests) => {
    try {
      localStorage.setItem(STORAGE_KEY_TEST_DIARIOS, JSON.stringify(tests))
    } catch (e) {
      console.error('Error al guardar test diarios de esterilización:', e)
    }
  }
}