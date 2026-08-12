/**
 * Persistencia aislada en LocalStorage para Quirúrgico (F2-07b).
 *
 * Maneja 2 tipos de datos, ambos con claves dinámicas por pacienteId:
 * - Implantes dentales: `quirurgico_implantes_${pacienteId}`
 * - Endodoncias: `quirurgico_endodoncia_${pacienteId}`
 *
 * Cumple Cap. VII.4 de la Constitución (try/catch obligatorio).
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

const construirKeyImplantes = (pacienteId) => `quirurgico_implantes_${pacienteId}`
const construirKeyEndodoncia = (pacienteId) => `quirurgico_endodoncia_${pacienteId}`

export const quirurgicoStorageService = {
  // Implantes
  obtenerImplantesDePaciente: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback
    return leerJSON(construirKeyImplantes(pacienteId), fallback)
  },

  guardarImplantesDePaciente: (pacienteId, implantes) => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyImplantes(pacienteId), implantes)
  },

  // Endodoncias
  obtenerEndodonciasDePaciente: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback
    return leerJSON(construirKeyEndodoncia(pacienteId), fallback)
  },

  guardarEndodonciasDePaciente: (pacienteId, endodoncias) => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyEndodoncia(pacienteId), endodoncias)
  },

  // Eliminar todos los datos quirúrgicos de un paciente
  eliminarDatosDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(construirKeyImplantes(pacienteId))
      localStorage.removeItem(construirKeyEndodoncia(pacienteId))
    } catch (e) {
      console.error(`Error al eliminar datos quirúrgicos del paciente ${pacienteId}:`, e)
    }
  }
}