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
import { createLogger } from './logger'

const log = createLogger('schemaMigrationService')

export interface VersionedData<T = unknown> {
  schemaVersion: number
  data: T
}

export type MigrationFunction<TIn = unknown, TOut = unknown> = (data: TIn) => TOut

export type MigrationsMap = Record<number, MigrationFunction<unknown, unknown>>

/**
 * Envuelve datos con un número de versión de esquema.
 * Formato resultante: { schemaVersion: N, data: ... }
 */
export const wrapWithVersion = <T>(data: T, version: number): VersionedData<T> => ({
  schemaVersion: version,
  data
})

/**
 * Verifica si un valor tiene formato de datos versionados.
 */
export const isVersionedData = <T = unknown>(raw: unknown): raw is VersionedData<T> => {
  if (raw === null || raw === undefined) return false
  if (typeof raw !== 'object') return false
  if (Array.isArray(raw)) return false
  const candidate = raw as Record<string, unknown>
  return (
    typeof candidate.schemaVersion === 'number' &&
    Number.isInteger(candidate.schemaVersion) &&
    candidate.schemaVersion > 0 &&
    'data' in candidate
  )
}

/**
 * Aplica migraciones secuenciales desde fromVersion hasta toVersion.
 */
const applyMigrations = <T>(
  data: unknown,
  fromVersion: number,
  toVersion: number,
  migrations: MigrationsMap
): T => {
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
    } catch (error: unknown) {
      log.error(
        `[schemaMigrationService] Error al aplicar migración ` +
        `v${currentVersion} → v${nextVersion}:`,
        error
      )
      // En caso de error, retornar datos tal como están (sin la migración fallida)
      break
    }
  }

  return currentData as T
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
 */
export const unwrapAndMigrate = <T, F = T>(
  raw: unknown,
  currentVersion: number,
  migrations: MigrationsMap = {},
  fallback?: F
): T | F | undefined => {
  // Caso 0: null/undefined → retornar fallback
  if (raw === null || raw === undefined) return fallback

  // Caso 1: datos no versionados → tratar como v1
  if (!isVersionedData<T>(raw)) {
    return applyMigrations<T>(raw, 1, currentVersion, migrations)
  }

  const { schemaVersion, data } = raw

  // Caso 2: versión futura (downgrade) → warning y retornar tal cual
  if (schemaVersion > currentVersion) {
    log.warn(
      `[schemaMigrationService] Datos con versión futura detectada ` +
      `(v${schemaVersion} > v${currentVersion}). ` +
      `No se puede migrar hacia atrás. Retornando datos tal cual.`
    )
    return data as T
  }

  // Caso 3: versión actual → retornar tal cual
  if (schemaVersion === currentVersion) {
    return data as T
  }

  // Caso 4: versión antigua → aplicar migraciones secuenciales
  return applyMigrations<T>(data, schemaVersion, currentVersion, migrations)
}
