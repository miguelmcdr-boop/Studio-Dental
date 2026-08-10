/**
 * Servicio de Persistencia Offline para Odontogramas
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

export const odontogramaStorageService = {
  obtenerOdontograma: (key, fallback = {}) => leerJSON(key, fallback),

  guardarOdontograma: (key, data) => escribirJSON(key, data),

  // Elimina ambos odontogramas (inicial y evolución) de un paciente (F2-07d)
  eliminarOdontogramasDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`odonto_inicial_${pacienteId}`)
      localStorage.removeItem(`odonto_evolucion_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar odontogramas del paciente ${pacienteId}:`, e)
    }
  }
}