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

const MIGRATION_MAP_KEY = 'studio_dental_migration_id_map_v1'

export const migrationStorageService = {
  /**
   * Obtiene el mapa completo de IDs legacy → Supabase.
   * @returns {Object} Mapa de legacyId a supabaseId
   */
  obtenerMapa: () => {
    return leerJSON(MIGRATION_MAP_KEY, {})
  },

  /**
   * Guarda el mapa completo.
   * @param {Object} mapa - Mapa de legacyId a supabaseId
   */
  guardarMapa: (mapa) => {
    return escribirJSON(MIGRATION_MAP_KEY, mapa)
  },

  /**
   * Registra un mapeo legacyId → supabaseId.
   * @param {string|number} legacyId
   * @param {string} supabaseId (UUID)
   */
  registrarMapeo: (legacyId, supabaseId) => {
    const mapa = migrationStorageService.obtenerMapa()
    mapa[`legacy_${legacyId}`] = supabaseId
    return migrationStorageService.guardarMapa(mapa)
  },

  /**
   * Obtiene el UUID de Supabase correspondiente a un legacyId.
   * @param {string|number} legacyId
   * @returns {string|null} UUID o null si no existe
   */
  obtenerSupabaseId: (legacyId) => {
    const mapa = migrationStorageService.obtenerMapa()
    return mapa[`legacy_${legacyId}`] || null
  },

  /**
   * Obtiene el legacyId correspondiente a un UUID de Supabase.
   * @param {string} supabaseId
   * @returns {string|null} legacyId (sin prefijo) o null si no existe
   */
  obtenerLegacyId: (supabaseId) => {
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
   * @param {string|number} legacyId
   * @returns {boolean}
   */
  yaFueMigrado: (legacyId) => {
    return migrationStorageService.obtenerSupabaseId(legacyId) !== null
  },

  /**
   * Limpia el mapa de migración (útil para pruebas o rollback).
   */
  limpiarMapa: () => {
    try {
      localStorage.removeItem(MIGRATION_MAP_KEY)
    } catch (e) {
      console.error('Error al limpiar mapa de migración:', e)
    }
  }
}
