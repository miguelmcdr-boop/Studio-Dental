/**
 * Servicio de purga de datos locales al logout — Studio Dental
 * Tarea MASTER_ROADMAP: F7-05
 *
 * Garantiza que al cerrar sesión no quede ninguna capa de persistencia local
 * con datos de PHI (información de salud protegida) del usuario saliente.
 * Esto previene la fuga de datos clínicos entre usuarios del mismo dispositivo
 * y es requisito del Definition of Done de Fase 7.
 *
 * Capas purgadas (cada una con try/catch independiente para ser fail-safe):
 *   1. Stores Zustand en memoria (usePacientesStore, usePrestacionesStore)
 *   2. localStorage (solo claves de la app, filtradas por prefijo)
 *   3. IndexedDB (base 'studio_dental_adjuntos' con blobs clínicos)
 *   4. Cache Storage del Service Worker (supabase-cache, static-resources)
 *
 * Principios (Constitución, Cap. V.2 Fail-Safe Clinical Default):
 *   - Cada paso es independiente: si uno falla, los demás siguen
 *   - Se emite warning por cada paso fallido (no aborta)
 *   - Se retorna resumen de lo purgado para observabilidad
 *
 * No se purga:
 *   - Sesión de Supabase Auth (eso lo hace sesionStore.logout)
 *   - Cookies (la app no usa cookies)
 *   - sessionStorage (no se usa en la app actualmente)
 */

import { usePacientesStore } from '../store/pacientesStore'
import { usePrestacionesStore } from '../store/prestacionesStore'
import { createLogger } from './logger'

const log = createLogger('purgarDatosLocales')

// Nombre de la base de datos IndexedDB de adjuntos (debe coincidir
// con adjuntosStorageService.js). Se redeclara aquí para evitar
// dependencias circulares entre servicios de almacenamiento.
const IDB_ADJUNTOS_DB_NAME = 'studio_dental_adjuntos'

// Prefijos de claves de localStorage que pertenecen a la app.
// Si una key no empieza con alguno de estos prefijos, NO se toca
// (por si hay datos de otras apps en el mismo dominio).
const PREFIJOS_APP = [
  'studio_dental_',     // claves de servicios de persistencia
  'clinica_',           // sesión activa, sección activa, paciente seleccionado
  'profile_',           // perfiles cacheados por email
  'recetas_',           // recetas por pacienteId
  'evoluciones_notas_', // evoluciones por pacienteId
  'certificados_',      // certificados por pacienteId
  'odontograma_',       // odontograma por pacienteId
  'periodontograma_',   // periodontograma por pacienteId
  'pediatria_',         // odontopediatría por pacienteId
  'quirurgico_',        // implantes/endodoncia por pacienteId
  'dsd_',               // diseño de sonrisa por clínicaId
  'sb-',                // claves de Supabase Auth (sb-<ref>-auth-token)
  'goTrue-',            // claves legacy de GoTrue (Supabase Auth antiguo)
]

/**
 * Verifica si una clave de localStorage pertenece a la app.
 * @param {string} key
 * @returns {boolean}
 */
const esClaveDeLaApp = (key) => PREFIJOS_APP.some((prefijo) => key.startsWith(prefijo))

/**
 * Paso 1: resetear stores Zustand en memoria.
 * Limpia los arrays de pacientes y prestaciones para que ningún hook
 * que lea del store vea datos del usuario saliente.
 */
const purgarStoresZustand = () => {
  const reseteados = []
  try {
    usePacientesStore.setState({ pacientes: [] })
    reseteados.push('pacientesStore')
  } catch (e) {
    log.warn('No se pudo resetear pacientesStore:', e.message)
  }
  try {
    usePrestacionesStore.setState({ prestaciones: [] })
    reseteados.push('prestacionesStore')
  } catch (e) {
    log.warn('No se pudo resetear prestacionesStore:', e.message)
  }
  return reseteados
}

/**
 * Paso 2: purgar localStorage (solo claves de la app).
 * Itera todas las claves del storage y elimina las que coinciden
 * con PREFIJOS_APP. No usa localStorage.clear() para no borrar
 * datos de otras apps en el mismo dominio.
 */
const purgarLocalStorage = () => {
  if (typeof localStorage === 'undefined') return 0

  let borradas = 0
  const claves = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      claves.push(localStorage.key(i))
    }
  } catch (e) {
    log.warn('No se pudieron enumerar claves de localStorage:', e.message)
    return 0
  }

  for (const key of claves) {
    if (key && esClaveDeLaApp(key)) {
      try {
        localStorage.removeItem(key)
        borradas++
      } catch (e) {
        log.warn(`No se pudo borrar clave ${key}:`, e.message)
      }
    }
  }
  return borradas
}

/**
 * Paso 3: purgar IndexedDB.
 * Usa deleteDatabase para eliminar completamente la base de adjuntos.
 * Es más robusto que abrir y limpiar el store porque garantiza que
 * la DB no quede en estado inconsistente.
 */
const purgarIndexedDB = async () => {
  if (typeof indexedDB === 'undefined') return { eliminada: false, razon: 'indexedDB no disponible' }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(IDB_ADJUNTOS_DB_NAME)
      request.onsuccess = () => resolve({ eliminada: true, razon: 'success' })
      request.onerror = () => resolve({ eliminada: false, razon: 'error' })
      request.onblocked = () => resolve({ eliminada: false, razon: 'blocked (otras pestañas abiertas)' })
    } catch (e) {
      resolve({ eliminada: false, razon: e.message })
    }
  })
}

/**
 * Paso 4: purgar Cache Storage del Service Worker.
 * Borra el contenido de todas las caches pero NO desregistra el SW
 * (desregistrarlo haría que la siguiente carga reinstale el SW y re-cachee
 * desde cero, lo cual no aporta seguridad adicional).
 *
 * Excluye caches que no sean del Service Worker de Vite PWA si es necesario.
 */
const purgarCacheStorage = async () => {
  if (typeof caches === 'undefined') return 0

  let borradas = 0
  try {
    const nombres = await caches.keys()
    for (const nombre of nombres) {
      try {
        await caches.delete(nombre)
        borradas++
      } catch (e) {
        log.warn(`No se pudo borrar cache ${nombre}:`, e.message)
      }
    }
  } catch (e) {
    log.warn('No se pudieron enumerar caches:', e.message)
  }
  return borradas
}

/**
 * Purga todas las capas de persistencia local.
 *
 * @param {Object} [options]
 * @param {Object} [options.logger] - logger opcional (por defecto usa el del módulo)
 * @returns {Promise<Object>} resumen de lo purgado en cada capa
 *
 * @example
 *   const resultado = await purgarDatosLocales()
 *   console.log(resultado)
 *   // { stores: ['pacientesStore','prestacionesStore'],
 *   //   localStorageKeys: 24,
 *   //   indexedDB: { eliminada: true, razon: 'success' },
 *   //   cacheStorageKeys: 2 }
 */
export const purgarDatosLocales = async (options = {}) => {
  const resultado = {
    stores: [],
    localStorageKeys: 0,
    indexedDB: { eliminada: false, razon: 'no ejecutado' },
    cacheStorageKeys: 0,
  }

  // Orden: primero memoria (rápido), luego localStorage (síncrono),
  // luego async (IndexedDB + Cache Storage). Este orden asegura que
  // los datos visibles en UI se limpien antes de los datos persistentes.
  resultado.stores = purgarStoresZustand()
  resultado.localStorageKeys = purgarLocalStorage()
  resultado.indexedDB = await purgarIndexedDB()
  resultado.cacheStorageKeys = await purgarCacheStorage()

  const logger = options.logger || log
  logger.info(
    `[F7-05] Purga completada — stores: ${resultado.stores.length}, ` +
    `localStorage: ${resultado.localStorageKeys} keys, ` +
    `indexedDB: ${resultado.indexedDB.eliminada ? 'OK' : resultado.indexedDB.razon}, ` +
    `cacheStorage: ${resultado.cacheStorageKeys} caches`
  )

  return resultado
}

