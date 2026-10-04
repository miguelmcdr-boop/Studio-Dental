/**
 * Persistencia aislada en LocalStorage para Quirúrgico (F2-07b).
 *
 * Maneja 2 tipos de datos, ambos con claves dinámicas por pacienteId:
 * - Implantes dentales: `quirurgico_implantes_${pacienteId}`
 * - Endodoncias: `quirurgico_endodoncia_${pacienteId}`
 *
 * Cumple Cap. VII.4 de la Constitución (try/catch obligatorio).
 */
import { leerJSON, escribirJSON } from '../../../infrastructure/storage/localStorageRepository'
import { obtenerDatoClinico, guardarDatoGenerico } from '../../../infrastructure/supabase/datosClinicosSupabase'
import { createLogger } from '../../../infrastructure/logging/logger'

const log = createLogger('quirurgicoStorageService')

export interface ImplanteItem {
  id: number | string
  fecha?: string
  pieza?: string
  marca?: string
  plataforma?: string
  diametro?: string
  longitud?: string
  torque?: number | null
  torqueInsercion?: number | string | null
  isq?: number | null
  isqInicial?: number | string | null
  lote?: string
  observacion?: string
  notas?: string
  [key: string]: unknown
}

export interface ConductoItem {
  nombre?: string
  cad?: string
  crd?: string
  ltp?: string
  referencia?: string
  limaApical?: string
  irrigacion?: string
  [key: string]: unknown
}

export interface EndodonciaItem {
  id: number | string
  fecha?: string
  pieza?: string
  conductos?: number | string | ConductoItem[]
  longitudConducto?: string
  tecnica?: string
  tecnicaObturacion?: string
  sellador?: string
  obturacion?: string
  notas?: string
  [key: string]: unknown
}

const construirKeyImplantes = (pacienteId: string | number): string => `quirurgico_implantes_${pacienteId}`
const construirKeyEndodoncia = (pacienteId: string | number): string => `quirurgico_endodoncia_${pacienteId}`

export const quirurgicoStorageService = {
  // Implantes
  // F4-02d-1: Intenta leer desde Supabase primero
  obtenerImplantesDePaciente: <T = ImplanteItem[]>(pacienteId?: string | number | null, fallback: T = [] as unknown as T): T => {
    if (!pacienteId) return fallback
    const datoClinico = obtenerDatoClinico<T>(pacienteId, 'quirurgico_implantes', null)
    return datoClinico !== null ? datoClinico : leerJSON<T>(construirKeyImplantes(pacienteId), fallback)
  },

  // F4-02d-2: Escribe en Supabase + localStorage
  guardarImplantesDePaciente: async (pacienteId?: string | number | null, implantes: unknown = []): Promise<boolean> => {
    if (!pacienteId) return false
    
    // Escribir en Supabase
    await guardarDatoGenerico(pacienteId, 'quirurgico_implantes', implantes)
    
    // Escribir en localStorage
    return escribirJSON(construirKeyImplantes(pacienteId), implantes)
  },

  // Endodoncias
  // F4-02d-1: Intenta leer desde Supabase primero
  obtenerEndodonciasDePaciente: <T = EndodonciaItem[]>(pacienteId?: string | number | null, fallback: T = [] as unknown as T): T => {
    if (!pacienteId) return fallback
    const datoClinico = obtenerDatoClinico<T>(pacienteId, 'quirurgico_endodoncia', null)
    return datoClinico !== null ? datoClinico : leerJSON<T>(construirKeyEndodoncia(pacienteId), fallback)
  },

  // F4-02d-2: Escribe en Supabase + localStorage
  guardarEndodonciasDePaciente: async (pacienteId?: string | number | null, endodoncias: unknown = []): Promise<boolean> => {
    if (!pacienteId) return false
    
    // Escribir en Supabase
    await guardarDatoGenerico(pacienteId, 'quirurgico_endodoncia', endodoncias)
    
    // Escribir en localStorage
    return escribirJSON(construirKeyEndodoncia(pacienteId), endodoncias)
  },

  // Eliminar todos los datos quirúrgicos de un paciente
  eliminarDatosDePaciente: (pacienteId?: string | number | null): void => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(construirKeyImplantes(pacienteId))
      localStorage.removeItem(construirKeyEndodoncia(pacienteId))
    } catch (e: unknown) {
      log.error(`Error al eliminar datos quirúrgicos del paciente ${pacienteId}:`, e)
    }
  }
}
