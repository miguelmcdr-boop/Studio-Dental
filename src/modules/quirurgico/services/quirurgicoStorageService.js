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
import { obtenerDatoClinico, guardarDatoGenerico } from '../../../services/datosClinicosSupabase'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('quirurgicoStorageService')

const construirKeyImplantes = (pacienteId) => `quirurgico_implantes_${pacienteId}`
const construirKeyEndodoncia = (pacienteId) => `quirurgico_endodoncia_${pacienteId}`

export const quirurgicoStorageService = {
  // Implantes
  // F4-02d-1: Intenta leer desde Supabase primero
  obtenerImplantesDePaciente: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback
    const datoClinico = obtenerDatoClinico(pacienteId, 'quirurgico_implantes', null)
    return datoClinico !== null ? datoClinico : leerJSON(construirKeyImplantes(pacienteId), fallback)
  },

  // F4-02d-2: Escribe en Supabase + localStorage
  guardarImplantesDePaciente: async (pacienteId, implantes) => {
    if (!pacienteId) return false
    
    // Escribir en Supabase
    await guardarDatoGenerico(pacienteId, 'quirurgico_implantes', implantes)
    
    // Escribir en localStorage
    return escribirJSON(construirKeyImplantes(pacienteId), implantes)
  },

  // Endodoncias
  // F4-02d-1: Intenta leer desde Supabase primero
  obtenerEndodonciasDePaciente: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback
    const datoClinico = obtenerDatoClinico(pacienteId, 'quirurgico_endodoncia', null)
    return datoClinico !== null ? datoClinico : leerJSON(construirKeyEndodoncia(pacienteId), fallback)
  },

  // F4-02d-2: Escribe en Supabase + localStorage
  guardarEndodonciasDePaciente: async (pacienteId, endodoncias) => {
    if (!pacienteId) return false
    
    // Escribir en Supabase
    await guardarDatoGenerico(pacienteId, 'quirurgico_endodoncia', endodoncias)
    
    // Escribir en localStorage
    return escribirJSON(construirKeyEndodoncia(pacienteId), endodoncias)
  },

  // Eliminar todos los datos quirúrgicos de un paciente
  eliminarDatosDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(construirKeyImplantes(pacienteId))
      localStorage.removeItem(construirKeyEndodoncia(pacienteId))
    } catch (e) {
      log.error(`Error al eliminar datos quirúrgicos del paciente ${pacienteId}:`, e)
    }
  }
}