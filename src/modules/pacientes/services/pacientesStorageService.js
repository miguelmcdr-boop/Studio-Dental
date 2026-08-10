/**
 * Persistencia de Pacientes
 */
import { createLocalStorageRepository, leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import { validarListaPacientes } from '../schemas/pacienteSchema'

const STORAGE_KEY_PACIENTES = 'studio_dental_pacientes_v3'
const pacientesRepo = createLocalStorageRepository(STORAGE_KEY_PACIENTES, [])

export const pacientesStorageService = {
  obtenerPacientes: (defaults = []) => {
    const datos = pacientesRepo.obtener(defaults)
    if (!Array.isArray(datos)) return defaults
    return datos
  },

  guardarPacientes: (pacientes) => {
    // (F2-04) — valida contra el esquema Zod antes de persistir. Si los datos
    // no son válidos, no se guardan y se logea el error para trazabilidad.
    const { valido, datos, error } = validarListaPacientes(pacientes)
    if (!valido) {
      console.error('Error de validación al guardar pacientes:', error)
      return false
    }
    return pacientesRepo.guardar(datos)
  },

  // Métodos genéricos para datos clínicos por paciente (evoluciones, recetas, etc.)
  obtenerItem: (key, fallback = []) => leerJSON(key, fallback),

  guardarItem: (key, data) => escribirJSON(key, data),

  // Elimina las evoluciones/notas de un paciente (F2-07d)
  eliminarEvolucionesDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`evoluciones_notas_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar evoluciones del paciente ${pacienteId}:`, e)
    }
  },

  // Elimina las recetas de un paciente (F2-07d)
  eliminarRecetasDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`recetas_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar recetas del paciente ${pacienteId}:`, e)
    }
  }
}