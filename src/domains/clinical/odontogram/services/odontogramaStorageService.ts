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
import { leerJSON, escribirJSON } from '../../../../infrastructure/storage/localStorageRepository'
import {
  guardarOdontograma as guardarOdontogramaSupabase,
  obtenerDatoClinico
} from '../../../../infrastructure/supabase/datosClinicosSupabase'
import { createLogger } from '../../../../infrastructure/logging/logger'

const log = createLogger('odontogramaStorageService')

export interface DienteEstado {
  general?: string
  caras?: Record<string, string>
  [key: string]: unknown
}

export type OdontogramaDatos = Record<string, DienteEstado | unknown>

export interface OdontogramaStorageServiceAPI {
  obtenerOdontogramaInicial: <T = OdontogramaDatos>(pacienteId: string | number | null | undefined, fallback?: T) => T
  obtenerOdontogramaEvolucion: <T = OdontogramaDatos>(pacienteId: string | number | null | undefined, fallback?: T) => T
  guardarOdontogramaInicial: (pacienteId: string | number | null | undefined, data: OdontogramaDatos) => Promise<boolean>
  guardarOdontogramaEvolucion: (pacienteId: string | number | null | undefined, data: OdontogramaDatos) => Promise<boolean>
  eliminarOdontogramasDePaciente: (pacienteId: string | number | null | undefined) => void
  obtenerOdontograma: <T = OdontogramaDatos>(key: string, fallback?: T) => T
  guardarOdontograma: (key: string, data: unknown) => boolean
}

export const odontogramaStorageService: OdontogramaStorageServiceAPI = {
  // ─────────────────────────────────────────────────────────────
  // F6-D-2: Lectura con prioridad Supabase → fallback localStorage
  // ─────────────────────────────────────────────────────────────

  obtenerOdontogramaInicial: <T = OdontogramaDatos>(pacienteId: string | number | null | undefined, fallback: T = {} as T): T => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(String(pacienteId), 'odonto_inicial', null)
    return (datoSupabase !== null ? datoSupabase : leerJSON<T>(`odonto_inicial_${pacienteId}`, fallback)) as T
  },

  obtenerOdontogramaEvolucion: <T = OdontogramaDatos>(pacienteId: string | number | null | undefined, fallback: T = {} as T): T => {
    if (!pacienteId) return fallback
    const datoSupabase = obtenerDatoClinico(String(pacienteId), 'odonto_evolucion', null)
    return (datoSupabase !== null ? datoSupabase : leerJSON<T>(`odonto_evolucion_${pacienteId}`, fallback)) as T
  },

  // ─────────────────────────────────────────────────────────────
  // F6-D-2: Escritura en Supabase + localStorage
  // ─────────────────────────────────────────────────────────────

  guardarOdontogramaInicial: async (pacienteId: string | number | null | undefined, data: OdontogramaDatos): Promise<boolean> => {
    if (!pacienteId) return false
    // F6-D-3 fix: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = Boolean(escribirJSON(`odonto_inicial_${pacienteId}`, data))
    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      await guardarOdontogramaSupabase(String(pacienteId), data, 'inicial')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('Error guardando en Supabase:', msg)
    }
    return result
  },

  guardarOdontogramaEvolucion: async (pacienteId: string | number | null | undefined, data: OdontogramaDatos): Promise<boolean> => {
    if (!pacienteId) return false
    // F6-D-3 fix: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = Boolean(escribirJSON(`odonto_evolucion_${pacienteId}`, data))
    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      await guardarOdontogramaSupabase(String(pacienteId), data, 'evolucion')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('Error guardando en Supabase:', msg)
    }
    return result
  },

  // ─────────────────────────────────────────────────────────────
  // F2-07d: Eliminación bidireccional (legacy)
  // ─────────────────────────────────────────────────────────────

  eliminarOdontogramasDePaciente: (pacienteId: string | number | null | undefined): void => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`odonto_inicial_${pacienteId}`)
      localStorage.removeItem(`odonto_evolucion_${pacienteId}`)
    } catch (e: unknown) {
      log.error(`Error al eliminar odontogramas del paciente ${pacienteId}:`, e)
    }
  },

  // ─────────────────────────────────────────────────────────────
  // API legacy (mantenida para compatibilidad con código que pasa keys)
  // ─────────────────────────────────────────────────────────────

  obtenerOdontograma: <T = OdontogramaDatos>(key: string, fallback: T = {} as T): T => leerJSON<T>(key, fallback),
  guardarOdontograma: (key: string, data: unknown): boolean => Boolean(escribirJSON(key, data))
}
