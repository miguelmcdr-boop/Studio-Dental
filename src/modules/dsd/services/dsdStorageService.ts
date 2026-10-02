/**
 * Persistencia aislada en LocalStorage para Diseño de Sonrisa Digital (F2-07b).
 *
 * Maneja configuración DSD con clave dinámica por pacienteId:
 * `dsd_config_${pacienteId}`
 *
 * Cumple Cap. VII.4 de la Constitución (try/catch obligatorio).
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import { createLogger } from '../../../services/logger'

const log = createLogger('dsdStorageService')

export interface DsdConfig {
  anchoCentral?: number
  altoCentral?: number
  tonoActual?: string
  tonoDeseado?: string
  formaDeseada?: string
  lineaSonrisa?: string
  observacionEstetica?: string
  [key: string]: unknown
}

const construirKeyDsd = (pacienteId: string | number): string => `dsd_config_${pacienteId}`

export const dsdStorageService = {
  obtenerConfigDePaciente: <T extends DsdConfig = DsdConfig>(
    pacienteId: string | number | null | undefined,
    fallback: T = {} as T
  ): T => {
    if (!pacienteId) return fallback
    return leerJSON<T>(construirKeyDsd(pacienteId), fallback)
  },

  guardarConfigDePaciente: (
    pacienteId: string | number | null | undefined,
    data: DsdConfig
  ): boolean => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyDsd(pacienteId), data)
  },

  // Eliminar configuración DSD de un paciente
  eliminarConfigDePaciente: (pacienteId: string | number | null | undefined): void => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(construirKeyDsd(pacienteId))
    } catch (e) {
      log.error(`Error al eliminar configuración DSD del paciente ${pacienteId}:`, e)
    }
  }
}
