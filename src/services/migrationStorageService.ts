/**
 * Servicio de mapeo de IDs legacy → Supabase (F4-02c-2).
 *
 * Durante la migración de localStorage a Supabase, los IDs originales
 * (números legacy o strings) se reemplazan por UUIDs generados por Supabase.
 * Este servicio mantiene un mapa bidireccional para que las migraciones
 * posteriores (citas, presupuestos, evoluciones, etc.) puedan referenciar
 * los pacientes por su nuevo UUID.
 *
 * Estructura del mapa:
 * {
 *   "legacy_1": "uuid-supabase-1",
 *   "legacy_2": "uuid-supabase-2",
 *   ...
 * }
 *
 * Se persiste en localStorage como backup, pero la fuente de verdad es
 * el mapa en memoria que se sincroniza con Supabase.
 */
import { leerJSON, escribirJSON } from './localStorageRepository'
import { createLogger } from './logger'

const log = createLogger('migrationStorageService')

export const MIGRATION_MAP_KEY = 'studio_dental_migration_id_map_v1'

export type MigrationMap = Record<string, string>

export interface MigrationStorageServiceAPI {
  obtenerMapa: () => MigrationMap
  guardarMapa: (mapa: MigrationMap) => void
  registrarMapeo: (legacyId: string | number, supabaseId: string) => void
  obtenerSupabaseId: (legacyId: string | number) => string | null
  obtenerLegacyId: (supabaseId: string) => string | null
  yaFueMigrado: (legacyId: string | number) => boolean
  limpiarMapa: () => void
}

export const migrationStorageService: MigrationStorageServiceAPI = {
  /**
   * Obtiene el mapa completo de IDs legacy → Supabase.
   * @returns Mapa de legacyId a supabaseId
   */
  obtenerMapa: (): MigrationMap => {
    return leerJSON<MigrationMap>(MIGRATION_MAP_KEY, {})
  },

  /**
   * Guarda el mapa completo.
   * @param mapa - Mapa de legacyId a supabaseId
   */
  guardarMapa: (mapa: MigrationMap): void => {
    escribirJSON(MIGRATION_MAP_KEY, mapa)
  },

  /**
   * Registra un mapeo legacyId → supabaseId.
   */
  registrarMapeo: (legacyId: string | number, supabaseId: string): void => {
    const mapa = migrationStorageService.obtenerMapa()
    mapa[`legacy_${legacyId}`] = supabaseId
    migrationStorageService.guardarMapa(mapa)
  },

  /**
   * Obtiene el UUID de Supabase correspondiente a un legacyId.
   */
  obtenerSupabaseId: (legacyId: string | number): string | null => {
    const mapa = migrationStorageService.obtenerMapa()
    return mapa[`legacy_${legacyId}`] || null
  },

  /**
   * Obtiene el legacyId correspondiente a un UUID de Supabase.
   */
  obtenerLegacyId: (supabaseId: string): string | null => {
    const mapa = migrationStorageService.obtenerMapa()
    for (const [legacyKey, uuid] of Object.entries(mapa)) {
      if (uuid === supabaseId) {
        return legacyKey.replace('legacy_', '')
      }
    }
    return null
  },

  /**
   * Verifica si un legacyId ya fue migrado.
   */
  yaFueMigrado: (legacyId: string | number): boolean => {
    return migrationStorageService.obtenerSupabaseId(legacyId) !== null
  },

  /**
   * Limpia el mapa de migración (útil para pruebas o rollback).
   */
  limpiarMapa: (): void => {
    try {
      localStorage.removeItem(MIGRATION_MAP_KEY)
    } catch (e: unknown) {
      log.error('Error al limpiar mapa de migración:', e)
    }
  }
}
