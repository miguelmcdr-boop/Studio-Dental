/**
 * Servicio de Persistencia de Odontogramas (F6-D-2)
 *
 * Estrategia: Supabase como fuente de verdad, localStorage como caché offline
 * (alineado con RFC F4-01 y patrón de quirurgicoStorageService).
 *
 * Maneja 2 tipos de odontogramas por paciente:
 * - Odontograma inicial: `odonto_inicial_${pacienteId}`
 * - Odontograma de evolución: `odonto_evolucion_${pacienteId}`
 *
 * API pública:
 * - obtenerOdontogramaInicial(pacienteId, fallback)  → SÍNCRONO, Supabase → localStorage
 * - obtenerOdontogramaEvolucion(pacienteId, fallback) → SÍNCRONO, Supabase → localStorage
 * - guardarOdontogramaInicial(pacienteId, data)      → ASYNC, Supabase + localStorage
 * - guardarOdontogramaEvolucion(pacienteId, data)    → ASYNC, Supabase + localStorage
 * - eliminarOdontogramasDePaciente(pacienteId)       → SÍNCRONO, limpia localStorage (F2-07d)
 * - obtenerOdontograma(key, fallback)                → LEGACY, mantenido para compatibilidad
 * - guardarOdontograma(key, data)                    → LEGACY, mantenido para compatibilidad
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import {
  guardarOdontograma as guardarOdontogramaSupabase,
  obtenerDatoClinico
} from '../../../services/datosClinicosSupabase'

export const odontogramaStorageService = {
  // ─────────────────────────────────────────────────────────────
  // F6-D-2: Lectura con prioridad Supabase → fallback localStorage
  // ─────────────────────────────────────────────────────────────

  obtenerOdontogramaInicial: (pacienteId, fallback = {}) => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(pacienteId, 'odonto_inicial', null)
    return datoSupabase !== null ? datoSupabase : leerJSON(`odonto_inicial_${pacienteId}`, fallback)
  },

  obtenerOdontogramaEvolucion: (pacienteId, fallback = {}) => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(pacienteId, 'odonto_evolucion', null)
    return datoSupabase !== null ? datoSupabase : leerJSON(`odonto_evolucion_${pacienteId}`, fallback)
  },

  // ─────────────────────────────────────────────────────────────
  // F6-D-2: Escritura en Supabase + localStorage
  // ─────────────────────────────────────────────────────────────

  guardarOdontogramaInicial: async (pacienteId, data) => {
    if (!pacienteId) return false
    try {
      await guardarOdontogramaSupabase(pacienteId, data, 'inicial')
    } catch (e) {
      console.warn('[odontogramaStorageService] Error guardando en Supabase (usando fallback localStorage):', e?.message)
    }
    return escribirJSON(`odonto_inicial_${pacienteId}`, data)
  },

  guardarOdontogramaEvolucion: async (pacienteId, data) => {
    if (!pacienteId) return false
    try {
      await guardarOdontogramaSupabase(pacienteId, data, 'evolucion')
    } catch (e) {
      console.warn('[odontogramaStorageService] Error guardando en Supabase (usando fallback localStorage):', e?.message)
    }
    return escribirJSON(`odonto_evolucion_${pacienteId}`, data)
  },

  // ─────────────────────────────────────────────────────────────
  // F2-07d: Eliminación bidireccional (legacy)
  // ─────────────────────────────────────────────────────────────

  eliminarOdontogramasDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`odonto_inicial_${pacienteId}`)
      localStorage.removeItem(`odonto_evolucion_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar odontogramas del paciente ${pacienteId}:`, e)
    }
  },

  // ─────────────────────────────────────────────────────────────
  // API legacy (mantenida para compatibilidad con código que pasa keys)
  // ─────────────────────────────────────────────────────────────

  obtenerOdontograma: (key, fallback = {}) => leerJSON(key, fallback),
  guardarOdontograma: (key, data) => escribirJSON(key, data)
}
