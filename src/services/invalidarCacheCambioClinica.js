/**
 * invalidarCacheCambioClinica — F7-36 FASE 1 (Commit 1.3)
 *
 * Orquesta la invalidación completa de cache cuando el usuario cambia
 * de clínica activa. Previene contaminación cross-clinic de datos
 * clínicos y financieros.
 *
 * Pasos fail-safe (cada uno con try/catch independiente):
 *   1. Invalidar claves tenant-aware de la clínica anterior
 *   2. Resetear cache en memoria de los 4 storage services principales
 *   3. Resetear stores Zustand (pacientesStore, prestacionesStore)
 *   4. Limpiar claves legacy `studio_dental_*` sin clinica_id
 *   5. Invalidar IndexedDB completa (base 'studio_dental_adjuntos')
 *
 * Principios:
 *   - Si un paso falla, los demás siguen
 *   - Se emite log por cada paso con resultado
 *   - Se retorna resumen estructurado para observabilidad
 *   - No toca claves de preferencias UI (darkMode, etc.)
 *
 * Uso:
 *   await invalidarCacheCambioClinica(clinicaAnteriorId)
 *
 * Si clinicaAnterior es null, usa invalidarTodas() en tenantCache.
 */

import { tenantCache } from './tenantCache'
import { finanzasStorageService } from '../modules/finanzas/services/finanzasStorageService'
import { agendaStorageService } from '../modules/agenda/services/agendaStorageService'
import { pagosStorageService } from '../modules/pagos/services/pagosStorageService'
import { presupuestosStorageService } from '../modules/presupuestos/services/presupuestosStorageService'
import { usePacientesStore } from '../store/pacientesStore'
import { usePrestacionesStore } from '../store/prestacionesStore'
import { createLogger } from './logger'

const log = createLogger('invalidarCacheCambioClinica')

// Nombre de la base de datos IndexedDB (debe coincidir con adjuntosStorageService.js)
const IDB_ADJUNTOS_DB_NAME = 'studio_dental_adjuntos'

// Prefijo de claves legacy (sin clinica_id) que deben eliminarse al cambiar clínica
const PREFIJO_LEGACY = 'studio_dental_'

/**
 * Paso 1: Invalidar claves tenant-aware de la clínica anterior.
 * @param {string|null} clinicaAnterior - ID de la clínica anterior o null
 * @returns {number} Cantidad de claves eliminadas
 */
const invalidarTenant = (clinicaAnterior) => {
  try {
    if (clinicaAnterior) {
      return tenantCache.invalidarClinica(clinicaAnterior)
    }
    return tenantCache.invalidarTodas()
  } catch (e) {
    log.error('Paso 1 falló (invalidarTenant):', e.message)
    return 0
  }
}

/**
 * Paso 2: Resetear cache en memoria de los 4 storage services principales.
 * @returns {number} Cantidad de servicios reseteados exitosamente
 */
const resetearStorageServices = () => {
  const servicios = [
    { nombre: 'finanzasStorageService', instancia: finanzasStorageService },
    { nombre: 'agendaStorageService', instancia: agendaStorageService },
    { nombre: 'pagosStorageService', instancia: pagosStorageService },
    { nombre: 'presupuestosStorageService', instancia: presupuestosStorageService },
  ]

  let reseteados = 0
  for (const { nombre, instancia } of servicios) {
    try {
      if (instancia && typeof instancia.resetCache === 'function') {
        instancia.resetCache()
        reseteados++
      }
    } catch (e) {
      log.warn(`No se pudo resetear ${nombre}:`, e.message)
    }
  }
  return reseteados
}

/**
 * Paso 3: Resetear stores Zustand.
 * @returns {string[]} Nombres de stores reseteados
 */
const resetearStoresZustand = () => {
  const reseteados = []
  try {
    usePacientesStore.setState({ pacientes: [] })
    reseteados.push('pacientesStore')
  } catch (e) {
    log.warn('No se pudo resetear pacientesStore:', e.message)
  }
  try {
    usePrestacionesStore.setState({ prestacionesArancel: [] })
    reseteados.push('prestacionesStore')
  } catch (e) {
    log.warn('No se pudo resetear prestacionesStore:', e.message)
  }
  return reseteados
}

/**
 * Paso 4: Limpiar claves legacy `studio_dental_*` sin clinica_id.
 * No toca claves tenant-aware (sd_<clinicaId>_*) ni preferencias UI (darkMode).
 * @returns {number} Cantidad de claves eliminadas
 */
const limpiarClavesLegacy = () => {
  let eliminadas = 0
  try {
    const claves = Object.keys(localStorage)
    for (const key of claves) {
      if (key.startsWith(PREFIJO_LEGACY)) {
        localStorage.removeItem(key)
        eliminadas++
      }
    }
  } catch (e) {
    log.error('Paso 4 falló (limpiarClavesLegacy):', e.message)
  }
  return eliminadas
}

/**
 * Paso 5: Invalidar IndexedDB completa (base 'studio_dental_adjuntos').
 * @returns {Promise<{eliminada: boolean, razon?: string}>}
 */
const invalidarIndexedDB = async () => {
  try {
    if (typeof indexedDB === 'undefined') {
      return { eliminada: false, razon: 'indexedDB no disponible' }
    }
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(IDB_ADJUNTOS_DB_NAME)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Error eliminando IndexedDB'))
      request.onblocked = () => {
        log.warn('IndexedDB bloqueado al intentar eliminar (otras pestañas abiertas)')
        resolve() // No es un error crítico, continuar
      }
    })
    return { eliminada: true }
  } catch (e) {
    log.error('Paso 5 falló (invalidarIndexedDB):', e.message)
    return { eliminada: false, razon: e.message }
  }
}

/**
 * Orquesta la invalidación completa de cache al cambiar de clínica.
 *
 * @param {string|null} clinicaAnterior - ID de la clínica anterior, o null si no se conoce
 * @returns {Promise<{
 *   tenantKeys: number,
 *   storageServices: number,
 *   stores: string[],
 *   legacyKeys: number,
 *   indexedDB: {eliminada: boolean, razon?: string},
 *   errores: number
 * }>} Resumen de lo invalidado
 */
export const invalidarCacheCambioClinica = async (clinicaAnterior = null) => {
  const resumen = {
    tenantKeys: 0,
    storageServices: 0,
    stores: [],
    legacyKeys: 0,
    indexedDB: { eliminada: false },
    errores: 0,
  }

  log.info(`Iniciando invalidación de cache (clínica anterior: ${clinicaAnterior || 'desconocida'})`)

  // Paso 1: tenant-aware
  resumen.tenantKeys = invalidarTenant(clinicaAnterior)

  // Paso 2: storage services (memoria)
  resumen.storageServices = resetearStorageServices()

  // Paso 3: stores Zustand
  resumen.stores = resetearStoresZustand()

  // Paso 4: claves legacy localStorage
  resumen.legacyKeys = limpiarClavesLegacy()

  // Paso 5: IndexedDB (async)
  resumen.indexedDB = await invalidarIndexedDB()

  // Contar errores
  if (resumen.indexedDB.eliminada === false && resumen.indexedDB.razon !== 'indexedDB no disponible') {
    resumen.errores++
  }

  log.info(
    `Invalidación completa: ` +
      `${resumen.tenantKeys} claves tenant, ` +
      `${resumen.storageServices} storage services, ` +
      `${resumen.stores.length} stores Zustand, ` +
      `${resumen.legacyKeys} claves legacy, ` +
      `IndexedDB: ${resumen.indexedDB.eliminada ? 'OK' : resumen.indexedDB.razon}`
  )

  return resumen
}
