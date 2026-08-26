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

import { wrapWithVersion, unwrapAndMigrate } from './schemaMigrationService'
import { createLogger } from './logger.js'

const log = createLogger('localStorageRepository')

/**
 * Lee y parsea de forma segura una clave de LocalStorage.
 * @param {string} key - Clave de LocalStorage a leer.
 * @param {*} fallback - Valor a retornar si la clave no existe o el JSON está corrupto.
 * @returns {*} El valor parseado, o `fallback` si no existe/falla el parseo.
 */
export const leerJSON = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : fallback
  } catch (e) {
    log.error(`Error al leer "${key}" desde localStorage:`, e)
    return fallback
  }
}

/**
 * Escribe de forma segura un valor serializable en una clave de LocalStorage.
 * @param {string} key - Clave de LocalStorage a escribir.
 * @param {*} value - Valor serializable a guardar (se aplica JSON.stringify).
 * @param {{ notify?: boolean, eventos?: string[] }} [opciones] - `notify` dispara
 *   el evento nativo `storage` (para sincronía entre pestañas/módulos);
 *   `eventos` dispara además CustomEvents adicionales por nombre.
 * @returns {boolean} `true` si la escritura fue exitosa, `false` si falló.
 */
export const escribirJSON = (key, value, opciones = {}) => {
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
 * Uso previsto: el caso común de los `*StorageService.js` de módulo, donde
 * cada dato de dominio (citas, pacientes, movimientos, etc.) vive bajo una
 * única clave conocida en tiempo de definición del servicio.
 *
 * F3-06 — Versionado de esquemas (opcional):
 * Si se pasan `schemaVersion` y `migrations`, el repositorio automáticamente:
 * - Al leer: desenvuelve datos versionados y aplica migraciones si están en
 *   versión antigua. Datos sin versión se tratan como v1 (backward compatible).
 * - Al escribir: envuelve los datos en `{ schemaVersion, data }` antes de persistir.
 *
 * Si NO se pasan estas opciones, el comportamiento es idéntico al original
 * (100% backward compatible con los 12 servicios existentes).
 *
 * @param {string} key - Clave de LocalStorage.
 * @param {*} defaultValue - Valor por defecto si la clave no existe o el dato está corrupto.
 * @param {{
 *   notify?: boolean,
 *   eventos?: string[],
 *   schemaVersion?: number,
 *   migrations?: Object<number, Function>
 * }} [opciones] - Opciones de eventos y versionado.
 * @returns {{
 *   key: string,
 *   obtener: (fallback?: *) => *,
 *   guardar: (value: *) => boolean
 * }}
 */
export const createLocalStorageRepository = (key, defaultValue, opciones = {}) => {
  const { notify, eventos, schemaVersion, migrations } = opciones

  // Solo activar versionado si schemaVersion es un número válido
  const hasVersioning = typeof schemaVersion === 'number'

  return {
    key,

    obtener: (fallback = defaultValue) => {
      const raw = leerJSON(key, fallback)

      // Sin versionado: retornar tal cual (comportamiento original)
      if (!hasVersioning) return raw

      // Con versionado: unwrap + migrate
      return unwrapAndMigrate(raw, schemaVersion, migrations || {}, fallback)
    },

    guardar: (value) => {
      // Sin versionado: guardar tal cual (comportamiento original)
      if (!hasVersioning) {
        return escribirJSON(key, value, { notify, eventos })
      }

      // Con versionado: wrap antes de persistir
      const wrapped = wrapWithVersion(value, schemaVersion)
      return escribirJSON(key, wrapped, { notify, eventos })
    }
  }
}