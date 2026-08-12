/**
 * Persistencia aislada en LocalStorage para Periodontograma (F2-07b).
 *
 * Maneja 3 tipos de datos, todos con claves dinámicas por pacienteId:
 * - Periodontograma inicial: `periodontograma_${pacienteId}`
 * - Periodontograma de control (reevaluación): `periodontograma_control_${pacienteId}`
 * - Historial de controles: `periodonto_historial_${pacienteId}`
 *
 * Cumple Cap. VII.4 de la Constitución (try/catch obligatorio en toda
 * llamada a localStorage, encapsulado en leerJSON/escribirJSON).
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

const construirKeyPeriodontograma = (pacienteId) => `periodontograma_${pacienteId}`
const construirKeyControl = (pacienteId) => `periodontograma_control_${pacienteId}`
const construirKeyHistorial = (pacienteId) => `periodonto_historial_${pacienteId}`

export const periodontogramaStorageService = {
  // Periodontograma inicial
  obtenerPeriodontogramaDePaciente: (pacienteId, fallback = {}) => {
    if (!pacienteId) return fallback
    return leerJSON(construirKeyPeriodontograma(pacienteId), fallback)
  },

  guardarPeriodontogramaDePaciente: (pacienteId, data) => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyPeriodontograma(pacienteId), data)
  },

  // Periodontograma de control (reevaluación)
  obtenerControlDePaciente: (pacienteId, fallback = {}) => {
    if (!pacienteId) return fallback
    return leerJSON(construirKeyControl(pacienteId), fallback)
  },

  guardarControlDePaciente: (pacienteId, data) => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyControl(pacienteId), data)
  },

  // Historial de controles (usado por usePeriodontograma)
  obtenerHistorialControles: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback
    return leerJSON(construirKeyHistorial(pacienteId), fallback)
  },

  guardarHistorialControles: (pacienteId, historial) => {
    if (!pacienteId) return false
    return escribirJSON(construirKeyHistorial(pacienteId), historial)
  },

  // Eliminar todos los datos de un paciente (para F2-07d - limpieza bidireccional)
  eliminarDatosDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(construirKeyPeriodontograma(pacienteId))
      localStorage.removeItem(construirKeyControl(pacienteId))
      localStorage.removeItem(construirKeyHistorial(pacienteId))
    } catch (e) {
      console.error(`Error al eliminar datos periodontales del paciente ${pacienteId}:`, e)
    }
  }
}