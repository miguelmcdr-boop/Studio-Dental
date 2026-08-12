/**
 * Persistencia aislada en LocalStorage para Odontopediatría (F2-07b).
 *
 * Maneja datos de odontopediatría con clave dinámica por pacienteId:
 * `pediatria_${pacienteId}`
 *
 * Cumple Cap. VII.4 de la Constitución (try/catch obligatorio).
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

const construirKeyPediatria = (pacienteId) => `pediatria_${pacienteId}`

export const odontopediatriaStorageService = {
  obtenerDatosDePaciente: (pacienteId, fallback = {}) => {
    if (!pacienteId) return fallback
    return leerJSON(construirKeyPediatria(pacienteId), fallback)
  },

  guardarDatosDePaciente: (pacienteId, datos) => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyPediatria(pacienteId), datos)
  },

  // Eliminar datos de odontopediatría de un paciente
  eliminarDatosDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(construirKeyPediatria(pacienteId))
    } catch (e) {
      console.error(`Error al eliminar datos de odontopediatría del paciente ${pacienteId}:`, e)
    }
  }
}