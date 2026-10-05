/**
 * Migración de claves de localStorage corruptas (Hotfix 3/4)
 *
 * Durante el bug de getClinicaActiva, las claves se generaron con
 * "[object Promise]" en lugar del UUID real. Este script las detecta
 * y migra al formato correcto al iniciar la app.
 */

import { getClinicaActivaSync } from '../auth/authService'
import { createLogger } from '../logging/logger'

const log = createLogger('migrateCorruptTenantKeys')
const PREFIX = 'sd_'
const CORRUPT_MARKER = '[object Promise]'

export interface MigrationResult {
  migrated: number
  deleted: number
  failed: number
  clinicaId: string | null
}

/**
 * Migra claves corruptas de localStorage al formato correcto.
 * Se ejecuta una sola vez al iniciar la app.
 *
 * @returns Resultado de la migración
 */
export const migrateCorruptTenantKeys = (): MigrationResult => {
  const result: MigrationResult = {
    migrated: 0,
    deleted: 0,
    failed: 0,
    clinicaId: null
  }

  try {
    if (typeof localStorage === 'undefined') return result

    const clinicaId = getClinicaActivaSync()
    if (!clinicaId) {
      log.info('No hay clínica activa, saltando migración de claves corruptas')
      return result
    }

    result.clinicaId = clinicaId

    // Obtener todas las claves corruptas
    const corruptKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(`${PREFIX}${CORRUPT_MARKER}_`)
    )

    if (corruptKeys.length === 0) {
      log.info('No se encontraron claves corruptas para migrar')
      return result
    }

    log.info(`Encontradas ${corruptKeys.length} claves corruptas para migrar`)

    // Migrar cada clave corrupta
    for (const corruptKey of corruptKeys) {
      try {
        // Extraer el baseKey (ej: de "sd_[object Promise]_studio_dental_pacientes_v3"
        // obtener "studio_dental_pacientes_v3")
        const prefixToRemove = `${PREFIX}${CORRUPT_MARKER}_`
        const baseKey = corruptKey.substring(prefixToRemove.length)

        // Construir la clave correcta
        const correctKey = `${PREFIX}${clinicaId}_${baseKey}`

        // Verificar si la clave correcta YA existe (no sobrescribir)
        const existingCorrect = localStorage.getItem(correctKey)
        const corruptValue = localStorage.getItem(corruptKey)

        if (!corruptValue) {
          // Clave corrupta sin valor, solo eliminar
          localStorage.removeItem(corruptKey)
          result.deleted++
          log.info(`Eliminada clave corrupta vacía: ${corruptKey}`)
          continue
        }

        if (existingCorrect !== null) {
          // La clave correcta ya existe, eliminar la corrupta sin migrar
          localStorage.removeItem(corruptKey)
          result.deleted++
          log.info(`Clave correcta ya existe, eliminada corrupta: ${corruptKey}`)
          continue
        }

        // Migrar: escribir bajo clave correcta y eliminar la corrupta
        localStorage.setItem(correctKey, corruptValue)
        localStorage.removeItem(corruptKey)
        result.migrated++
        log.info(`Migrada: ${corruptKey} → ${correctKey}`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log.error(`Error migrando clave ${corruptKey}:`, msg)
        result.failed++
      }
    }

    log.info(
      `Migración completada: ${result.migrated} migradas, ` +
      `${result.deleted} eliminadas, ${result.failed} fallidas`
    )

    return result
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('Error crítico en migrateCorruptTenantKeys:', msg)
    return result
  }
}
