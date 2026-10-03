/**
 * Persistencia aislada en LocalStorage para Odontopediatría (F2-07b).
 *
 * Maneja datos de odontopediatría con clave dinámica por pacienteId:
 * `pediatria_${pacienteId}`
 *
 * Cumple Cap. VII.4 de la Constitución (try/catch obligatorio).
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import { createLogger } from '../../../services/logger'

const log = createLogger('odontopediatriaStorageService')

export interface HabitosNocivos {
  chupete?: boolean
  succionDigital?: boolean
  deglucionAtipica?: boolean
  respiradorBucal?: boolean
}

export interface DatosPediatria {
  gradoFrankl?: number
  observacionConducta?: string
  mapaOleary?: Record<string, Record<string, boolean>>
  piezasPresentesOleary?: number
  habitosNocivos?: HabitosNocivos
  dentosanaRegistrada?: boolean
  mapaDentosana?: Record<string, unknown>
}

const construirKeyPediatria = (pacienteId: string | number): string => `pediatria_${pacienteId}`

export const odontopediatriaStorageService = {
  obtenerDatosDePaciente: <T extends DatosPediatria = DatosPediatria>(
    pacienteId: string | number | null | undefined,
    fallback: T = {} as T
  ): T => {
    if (!pacienteId) return fallback
    return leerJSON<T>(construirKeyPediatria(pacienteId), fallback)
  },

  guardarDatosDePaciente: (
    pacienteId: string | number | null | undefined,
    datos: DatosPediatria
  ): boolean => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyPediatria(pacienteId), datos)
  },

  // Eliminar datos de odontopediatría de un paciente
  eliminarDatosDePaciente: (pacienteId: string | number | null | undefined): void => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(construirKeyPediatria(pacienteId))
    } catch (e) {
      log.error(`Error al eliminar datos de odontopediatría del paciente ${pacienteId}:`, e)
    }
  }
}
