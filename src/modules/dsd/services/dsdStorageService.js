/**
 * Persistencia aislada en LocalStorage para Diseño de Sonrisa Digital (F2-07b).
 *
 * Maneja configuración DSD con clave dinámica por pacienteId:
 * `dsd_config_${pacienteId}`
 *
 * Cumple Cap. VII.4 de la Constitución (try/catch obligatorio).
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('dsdStorageService')

const construirKeyDsd = (pacienteId) => `dsd_config_${pacienteId}`

export const dsdStorageService = {
  obtenerConfigDePaciente: (pacienteId, fallback = {}) => {
    if (!pacienteId) return fallback
    return leerJSON(construirKeyDsd(pacienteId), fallback)
  },

  guardarConfigDePaciente: (pacienteId, data) => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyDsd(pacienteId), data)
  },

  // Eliminar configuración DSD de un paciente
  eliminarConfigDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(construirKeyDsd(pacienteId))
    } catch (e) {
      log.error(`Error al eliminar configuración DSD del paciente ${pacienteId}:`, e)
    }
  }
}