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
import { leerJSON, escribirJSON } from '../../../../services/localStorageRepository'
import {
  guardarPeriodontograma as guardarPeriodontogramaSupabase,
  guardarPeriodontogramaHistorial as guardarPeriodontogramaHistorialSupabase,
  obtenerDatoClinico
} from '../../../../services/datosClinicosSupabase'
import { createLogger } from '../../../../services/logger'
import type { ControlPeriodontal, PiezaPeriodontal } from '../schemas/periodontalSchema'

const log = createLogger('periodontogramaStorageService')

export type PeriodontogramaData = {
  piezas?: Record<string, PiezaPeriodontal>
  [key: string]: unknown
}

export interface PeriodontogramaStorageServiceAPI {
  obtenerPeriodontogramaDePaciente: <T = PeriodontogramaData>(pacienteId: string | number | null | undefined, fallback?: T) => T
  obtenerControlDePaciente: <T = PeriodontogramaData>(pacienteId: string | number | null | undefined, fallback?: T) => T
  obtenerHistorialControles: <T = ControlPeriodontal[]>(pacienteId: string | number | null | undefined, fallback?: T) => T
  guardarPeriodontogramaDePaciente: (pacienteId: string | number | null | undefined, data: PeriodontogramaData) => Promise<boolean>
  guardarControlDePaciente: (pacienteId: string | number | null | undefined, data: PeriodontogramaData) => Promise<boolean>
  guardarHistorialControles: (pacienteId: string | number | null | undefined, historial: ControlPeriodontal[]) => Promise<boolean>
  eliminarDatosDePaciente: (pacienteId: string | number | null | undefined) => void
}

export const periodontogramaStorageService: PeriodontogramaStorageServiceAPI = {
  // ─────────────────────────────────────────────────────────────
  // F6-D-3: Lectura con prioridad Supabase → fallback localStorage
  // ─────────────────────────────────────────────────────────────

  obtenerPeriodontogramaDePaciente: <T = PeriodontogramaData>(pacienteId: string | number | null | undefined, fallback: T = {} as T): T => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(String(pacienteId), 'periodontograma', null)
    return (datoSupabase !== null ? datoSupabase : leerJSON<T>(`periodontograma_${pacienteId}`, fallback)) as T
  },

  obtenerControlDePaciente: <T = PeriodontogramaData>(pacienteId: string | number | null | undefined, fallback: T = {} as T): T => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(String(pacienteId), 'periodontograma_control', null)
    return (datoSupabase !== null ? datoSupabase : leerJSON<T>(`periodontograma_control_${pacienteId}`, fallback)) as T
  },

  obtenerHistorialControles: <T = ControlPeriodontal[]>(pacienteId: string | number | null | undefined, fallback: T = [] as unknown as T): T => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(String(pacienteId), 'periodonto_historial', null)
    return (datoSupabase !== null ? datoSupabase : leerJSON<T>(`periodonto_historial_${pacienteId}`, fallback)) as T
  },

  // ─────────────────────────────────────────────────────────────
  // F6-D-3: Escritura en Supabase + localStorage
  // ─────────────────────────────────────────────────────────────

  guardarPeriodontogramaDePaciente: async (pacienteId: string | number | null | undefined, data: PeriodontogramaData): Promise<boolean> => {
    if (!pacienteId) return false
    // F6-D-3 fix: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = Boolean(escribirJSON(`periodontograma_${pacienteId}`, data))
    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      await guardarPeriodontogramaSupabase(String(pacienteId), data, 'inicial')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('Error guardando periodontograma inicial en Supabase:', msg)
    }
    return result
  },

  guardarControlDePaciente: async (pacienteId: string | number | null | undefined, data: PeriodontogramaData): Promise<boolean> => {
    if (!pacienteId) return false
    // F6-D-3 fix: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = Boolean(escribirJSON(`periodontograma_control_${pacienteId}`, data))
    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      await guardarPeriodontogramaSupabase(String(pacienteId), data, 'control')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('Error guardando control en Supabase:', msg)
    }
    return result
  },

  guardarHistorialControles: async (pacienteId: string | number | null | undefined, historial: ControlPeriodontal[]): Promise<boolean> => {
    if (!pacienteId) return false
    // F6-D-3 fix: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = Boolean(escribirJSON(`periodonto_historial_${pacienteId}`, historial))
    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      await guardarPeriodontogramaHistorialSupabase(String(pacienteId), historial)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('Error guardando historial en Supabase:', msg)
    }
    return result
  },

  // ─────────────────────────────────────────────────────────────
  // F2-07d: Eliminación bidireccional
  // ─────────────────────────────────────────────────────────────

  eliminarDatosDePaciente: (pacienteId: string | number | null | undefined): void => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`periodontograma_${pacienteId}`)
      localStorage.removeItem(`periodontograma_control_${pacienteId}`)
      localStorage.removeItem(`periodonto_historial_${pacienteId}`)
    } catch (e: unknown) {
      log.error(`Error al eliminar datos periodontales del paciente ${pacienteId}:`, e)
    }
  }
}
