/**
 * Repositorio genérico de persistencia en LocalStorage.
 * Tarea MASTER_ROADMAP: F2-03 (base), F3-06 (versionado)
 *
 * Extrae el patrón try/catch + JSON.parse/JSON.stringify que estaba
 * duplicado en los 14 `*StorageService.js` de módulo. No reemplaza la
 * lógica de dominio de cada servicio (sincronizaciones cruzadas, eventos
 * custom, validaciones) — solo la lectura/escritura mecánica de una clave
 * de LocalStorage.
 *
 * Cumple el Cap. VII.4 de la Constitución de Arquitectura (try/catch
 * obligatorio en toda llamada a LocalStorage/IndexedDB).
 *
 * F3-06: Soporte opcional de versionado de esquemas mediante las opciones
 * `schemaVersion` y `migrations`. Comportamiento backward compatible:
 * si no se especifican estas opciones, el repositorio funciona exactamente
 * igual que antes.
 */

import { wrapWithVersion, unwrapAndMigrate } from '../persistence/schemaMigrationService'
import { createLogger } from '../logging/logger'
import { tenantCache } from '../tenant/tenantCache'

const log = createLogger('localStorageRepository')

export interface WriteOptions {
  notify?: boolean
  eventos?: string[]
}

export interface RepositoryOptions extends WriteOptions {
  schemaVersion?: number
  migrations?: Record<number, (data: unknown) => unknown>
}

export interface LocalStorageRepository<T> {
  key: string
  obtener: (fallback?: T) => T
  guardar: (value: T) => boolean
}

export interface TenantRepository<T> {
  baseKey: string
  obtener: (fallback?: T) => T
  guardar: (value: T) => boolean
  eliminar: () => boolean
  existe: () => boolean
}

/**
 * Lee y parsea de forma segura una clave de LocalStorage.
 * @param key - Clave de LocalStorage a leer.
 * @param fallback - Valor a retornar si la clave no existe o el JSON está corrupto.
 * @returns El valor parseado, o `fallback` si no existe/falla el parseo.
 */
export const leerJSON = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key)
    return saved !== null ? (JSON.parse(saved) as T) : fallback
  } catch (e) {
    log.error(`Error al leer "${key}" desde localStorage:`, e)
    return fallback
  }
}

/**
 * Escribe de forma segura un valor serializable en una clave de LocalStorage.
 * @param key - Clave de LocalStorage a escribir.
 * @param value - Valor serializable a guardar (se aplica JSON.stringify).
 * @param opciones - `notify` dispara el evento nativo `storage`;
 *   `eventos` dispara además CustomEvents adicionales por nombre.
 * @returns `true` si la escritura fue exitosa, `false` si falló.
 */
export const escribirJSON = (key: string, value: unknown, opciones: WriteOptions = {}): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    if (opciones.notify) {
      window.dispatchEvent(new Event('storage'))
    }
    ;(opciones.eventos || []).forEach((nombreEvento) => {
      window.dispatchEvent(new CustomEvent(nombreEvento))
    })
    return true
  } catch (e) {
    log.error(`Error al guardar "${key}" en localStorage:`, e)
    return false
  }
}

/**
 * Crea un repositorio ligado a una clave fija de LocalStorage.
 */
export const createLocalStorageRepository = <T>(
  key: string,
  defaultValue: T,
  opciones: RepositoryOptions = {}
): LocalStorageRepository<T> => {
  const { notify, eventos, schemaVersion, migrations } = opciones
  const hasVersioning = typeof schemaVersion === 'number'

  return {
    key,

    obtener: (fallback: T = defaultValue): T => {
      const raw = leerJSON<T>(key, fallback)
      if (!hasVersioning) return raw
      return unwrapAndMigrate(raw, schemaVersion, migrations || {}, fallback) as T
    },

    guardar: (value: T): boolean => {
      if (!hasVersioning) {
        return escribirJSON(key, value, { notify, eventos })
      }
      const wrapped = wrapWithVersion(value, schemaVersion)
      return escribirJSON(key, wrapped, { notify, eventos })
    }
  }
}

/**
 * Repositorio genérico de persistencia aislado por clínica (multi-tenant).
 */
export const createTenantRepository = <T>(
  baseKey: string,
  defaultValue: T,
  opciones: RepositoryOptions = {}
): TenantRepository<T> => {
  const { notify, eventos, schemaVersion, migrations } = opciones
  const hasVersioning = typeof schemaVersion === 'number'

  return {
    baseKey,

    /**
     * Lee datos del tenant actual. Si no hay clínica activa, retorna fallback
     * con log.warn (fail-safe, nunca lanza error).
     */
    obtener: (fallback: T = defaultValue): T => {
      try {
        const raw = tenantCache.leerTenant<T>(baseKey, fallback)
        if (!hasVersioning) return raw
        return unwrapAndMigrate(raw, schemaVersion, migrations || {}, fallback) as T
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log.warn(`createTenantRepository.obtener sin clínica activa para "${baseKey}": ${msg}`)
        return fallback
      }
    },

    /**
     * Escribe datos en el tenant actual. Si no hay clínica activa, retorna false
     * con log.warn y NO dispara eventos.
     */
    guardar: (value: T): boolean => {
      try {
        const wrapped = hasVersioning ? wrapWithVersion(value, schemaVersion) : value
        const ok = tenantCache.escribirTenant(baseKey, wrapped)
        if (!ok) {
          log.warn(`createTenantRepository.guardar falló para "${baseKey}"`)
          return false
        }
        if (notify) {
          window.dispatchEvent(new Event('storage'))
        }
        ;(eventos || []).forEach((nombreEvento) => {
          window.dispatchEvent(new CustomEvent(nombreEvento))
        })
        return true
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log.warn(`createTenantRepository.guardar sin clínica activa para "${baseKey}": ${msg}`)
        return false
      }
    },

    /**
     * Elimina la clave del tenant actual. Si no hay clínica activa, retorna false
     * con log.warn (fail-safe).
     */
    eliminar: (): boolean => {
      try {
        return tenantCache.eliminarTenant(baseKey)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log.warn(`createTenantRepository.eliminar sin clínica activa para "${baseKey}": ${msg}`)
        return false
      }
    },

    /**
     * Verifica si existe la clave en el tenant actual. Si no hay clínica activa,
     * retorna false con log.warn (fail-safe).
     */
    existe: (): boolean => {
      try {
        return tenantCache.existeTenant(baseKey)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log.warn(`createTenantRepository.existe sin clínica activa para "${baseKey}": ${msg}`)
        return false
      }
    }
  }
}

export const createTenantLocalStorageRepository = createTenantRepository
