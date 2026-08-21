/**
 * Servicio de Persistencia de Periodontogramas (F6-D-3)
 *
 * Estrategia: Supabase como fuente de verdad, localStorage como caché offline
 * (alineado con RFC F4-01 y patrón de odontogramaStorageService / quirurgicoStorageService).
 *
 * Maneja 3 tipos de datos, todos con claves dinámicas por pacienteId:
 * - Periodontograma inicial: `periodontograma_${pacienteId}` → Supabase tabla periodontogramas (tipo='inicial')
 * - Periodontograma de control: `periodontograma_control_${pacienteId}` → Supabase tabla periodontogramas (tipo='control')
 * - Historial de controles: `periodonto_historial_${pacienteId}` → Supabase tabla periodontogramas_historial
 *
 * API pública:
 * - obtenerPeriodontogramaDePaciente(pacienteId, fallback)  → SÍNCRONO, Supabase → localStorage
 * - obtenerControlDePaciente(pacienteId, fallback)          → SÍNCRONO, Supabase → localStorage
 * - obtenerHistorialControles(pacienteId, fallback)         → SÍNCRONO, Supabase → localStorage
 * - guardarPeriodontogramaDePaciente(pacienteId, data)      → ASYNC, Supabase + localStorage
 * - guardarControlDePaciente(pacienteId, data)              → ASYNC, Supabase + localStorage
 * - guardarHistorialControles(pacienteId, historial)        → ASYNC, Supabase + localStorage
 * - eliminarDatosDePaciente(pacienteId)                     → SÍNCRONO, limpia localStorage (F2-07d)
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import {
  guardarPeriodontograma as guardarPeriodontogramaSupabase,
  guardarPeriodontogramaHistorial as guardarPeriodontogramaHistorialSupabase,
  obtenerDatoClinico
} from '../../../services/datosClinicosSupabase'

export const periodontogramaStorageService = {
  // ─────────────────────────────────────────────────────────────
  // F6-D-3: Lectura con prioridad Supabase → fallback localStorage
  // ─────────────────────────────────────────────────────────────

  obtenerPeriodontogramaDePaciente: (pacienteId, fallback = {}) => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(pacienteId, 'periodontograma', null)
    return datoSupabase !== null ? datoSupabase : leerJSON(`periodontograma_${pacienteId}`, fallback)
  },

  obtenerControlDePaciente: (pacienteId, fallback = {}) => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(pacienteId, 'periodontograma_control', null)
    return datoSupabase !== null ? datoSupabase : leerJSON(`periodontograma_control_${pacienteId}`, fallback)
  },

  obtenerHistorialControles: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(pacienteId, 'periodonto_historial', null)
    return datoSupabase !== null ? datoSupabase : leerJSON(`periodonto_historial_${pacienteId}`, fallback)
  },

  // ─────────────────────────────────────────────────────────────
  // F6-D-3: Escritura en Supabase + localStorage
  // ─────────────────────────────────────────────────────────────

  guardarPeriodontogramaDePaciente: async (pacienteId, data) => {
    if (!pacienteId) return false
    // F6-D-3 fix: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = escribirJSON(`periodontograma_${pacienteId}`, data)
    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      await guardarPeriodontogramaSupabase(pacienteId, data, 'inicial')
    } catch (e) {
      console.warn('[periodontogramaStorageService] Error guardando periodontograma inicial en Supabase:', e?.message)
    }
    return result
  },

  guardarControlDePaciente: async (pacienteId, data) => {
    if (!pacienteId) return false
    // F6-D-3 fix: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = escribirJSON(`periodontograma_control_${pacienteId}`, data)
    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      await guardarPeriodontogramaSupabase(pacienteId, data, 'control')
    } catch (e) {
      console.warn('[periodontogramaStorageService] Error guardando control en Supabase:', e?.message)
    }
    return result
  },

  guardarHistorialControles: async (pacienteId, historial) => {
    if (!pacienteId) return false
    // F6-D-3 fix: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = escribirJSON(`periodonto_historial_${pacienteId}`, historial)
    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      await guardarPeriodontogramaHistorialSupabase(pacienteId, historial)
    } catch (e) {
      console.warn('[periodontogramaStorageService] Error guardando historial en Supabase:', e?.message)
    }
    return result
  },

  // ─────────────────────────────────────────────────────────────
  // F2-07d: Eliminación bidireccional
  // ─────────────────────────────────────────────────────────────

  eliminarDatosDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`periodontograma_${pacienteId}`)
      localStorage.removeItem(`periodontograma_control_${pacienteId}`)
      localStorage.removeItem(`periodonto_historial_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar datos periodontales del paciente ${pacienteId}:`, e)
    }
  }
}
