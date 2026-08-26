/**
 * Servicio de migración de esquemas (F3-06 — MASTER_ROADMAP).
 *
 * Proporciona funciones centralizadas para envolver datos con un número de
 * versión y migrarlos automáticamente cuando el esquema evoluciona.
 *
 * Diseño:
 * - `wrapWithVersion(data, version)`: envuelve datos en { schemaVersion, data }
 * - `isVersionedData(raw)`: verifica si un objeto tiene formato versionado
 * - `unwrapAndMigrate(raw, currentVersion, migrations, fallback)`: desenvuelve
 *   y migra datos desde una versión antigua hasta la versión actual
 *
 * Compatibilidad:
 * - Datos sin formato versionado se tratan como v1 (backward compatibility)
 * - Datos con versión futura se retornan tal cual con warning (no down-migran)
 * - Errores en migraciones se logean y retornan datos originales
 *
 * Cumple el criterio de F3-06: "al menos un caso de migración real testeado".
 */

/**
 * Envuelve datos con un número de versión de esquema.
 * Formato resultante: { schemaVersion: N, data: ... }
 *
 * @param {*} data - Datos a envolver.
 * @param {number} version - Número de versión del esquema.
 * @returns {{ schemaVersion: number, data: * }}
 */
import { createLogger } from './logger.js'

const log = createLogger('schemaMigrationService')
export const wrapWithVersion = (data, version) => ({
  schemaVersion: version,
  data
})

/**
 * Verifica si un valor tiene formato de datos versionados.
 *
 * @param {*} raw - Valor a verificar.
 * @returns {boolean} true si tiene { schemaVersion: number, data: * }.
 */
export const isVersionedData = (raw) => {
  if (raw === null || raw === undefined) return false
  if (typeof raw !== 'object') return false
  if (Array.isArray(raw)) return false
  return (
    typeof raw.schemaVersion === 'number' &&
    Number.isInteger(raw.schemaVersion) &&
    raw.schemaVersion > 0 &&
    'data' in raw
  )
}

/**
 * Desenvuelve y migra datos desde una versión antigua hasta la versión actual.
 *
 * Comportamiento:
 * - Si `raw` no tiene formato versionado, se trata como v1 (backward compatibility)
 * - Si `raw.schemaVersion === currentVersion`, retorna los datos tal cual
 * - Si `raw.schemaVersion < currentVersion`, aplica migraciones secuenciales
 * - Si `raw.schemaVersion > currentVersion`, retorna datos con warning (no down-migra)
 * - Si una migración falla, retorna datos originales con error logeado
 *
 * @param {*} raw - Datos crudos leídos de localStorage.
 * @param {number} currentVersion - Versión actual del esquema.
 * @param {Object<number, Function>} migrations - Mapa de funciones de migración
 *   donde la clave es la versión destino (ej: { 2: fnV1aV2, 3: fnV2aV3 }).
 * @param {*} fallback - Valor a retornar si `raw` es null/undefined.
 * @returns {*} Datos migrados a la versión actual.
 */
export const unwrapAndMigrate = (raw, currentVersion, migrations = {}, fallback) => {
  // Caso 0: null/undefined → retornar fallback
  if (raw === null || raw === undefined) return fallback

  // Caso 1: datos no versionados → tratar como v1
  if (!isVersionedData(raw)) {
    return applyMigrations(raw, 1, currentVersion, migrations)
  }

  const { schemaVersion, data } = raw

  // Caso 2: versión futura (downgrade) → warning y retornar tal cual
  if (schemaVersion > currentVersion) {
    log.warn(
      `[schemaMigrationService] Datos con versión futura detectada ` +
      `(v${schemaVersion} > v${currentVersion}). ` +
      `No se puede migrar hacia atrás. Retornando datos tal cual.`
    )
    return data
  }

  // Caso 3: versión actual → retornar tal cual
  if (schemaVersion === currentVersion) {
    return data
  }

  // Caso 4: versión antigua → aplicar migraciones secuenciales
  return applyMigrations(data, schemaVersion, currentVersion, migrations)
}

/**
 * Aplica migraciones secuenciales desde fromVersion hasta toVersion.
 *
 * @private
 */
const applyMigrations = (data, fromVersion, toVersion, migrations) => {
  let currentData = data
  let currentVersion = fromVersion

  while (currentVersion < toVersion) {
    const nextVersion = currentVersion + 1
    const migrationFn = migrations[nextVersion]

    if (!migrationFn) {
      log.warn(
        `[schemaMigrationService] Migración v${currentVersion} → v${nextVersion} ` +
        `no definida. Deteniendo migración en v${currentVersion}.`
      )
      break
    }

    try {
      currentData = migrationFn(currentData)
      currentVersion = nextVersion
    } catch (error) {
      log.error(
        `[schemaMigrationService] Error al aplicar migración ` +
        `v${currentVersion} → v${nextVersion}:`,
        error
      )
      // En caso de error, retornar datos tal como están (sin la migración fallida)
      break
    }
  }

  return currentData
}