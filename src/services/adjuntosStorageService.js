/**
 * Servicio de persistencia de adjuntos clínicos binarios — Studio Dental
 * Tarea MASTER_ROADMAP: F1-02 (IndexedDB) + F6-E (Supabase Storage)
 *
 * REGLA DE ARQUITECTURA (Constitución, Cap. V.1): archivos binarios
 * (fotografías clínicas, radiografías, consentimientos informados firmados)
 * se persisten en IndexedDB, nunca en localStorage (límite de 5MB) ni en
 * memoria de React (se pierden al refrescar la página).
 *
 * F6-E: IndexedDB pasa a ser caché offline; Supabase Storage es la fuente
 * de verdad. Estrategia offline-first: guardar primero en IndexedDB
 * (síncrono, inmediato), luego intentar subir a Supabase (asíncrono).
 * Si Supabase falla, el adjunto sigue disponible localmente.
 *
 * Ningún componente accede a IndexedDB directamente — toda la app pasa por
 * este servicio (Cap. III de la Constitución).
 */

import {
  subirAdjunto,
  eliminarAdjuntoDeStorage,
  storageDisponible
} from './adjuntosSupabaseService'
import { useSesionStore } from '../store/sesionStore'
import { createTenantRepository } from './localStorageRepository'
import { createLogger } from './logger'

const log = createLogger('adjuntosStorageService')

// P0-2: Cola local de subidas diferidas aislada por tenant
const pendingUploadsRepo = createTenantRepository('studio_dental_adjuntos_pending_uploads', [])

const DB_NAME = 'studio_dental_adjuntos'
// F7-36 FASE 1 (Commit 1.6): versión 2 agrega aislamiento multi-tenant
// vía campo clinicaId en registros e índice para consultas filtradas.
const DB_VERSION = 2
const STORE_NAME = 'adjuntos'
const INDEX_PACIENTE = 'pacienteId'
const INDEX_CLINICA = 'clinicaId'

let dbPromise = null

const indexedDBDisponible = () => typeof indexedDB !== 'undefined'

const abrirDB = () => {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (!indexedDBDisponible()) {
      reject(new Error('IndexedDB no está disponible en este navegador. Los adjuntos no se pueden guardar en este dispositivo.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      const oldVersion = event.oldVersion

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Instalación nueva: crear store con ambos índices
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex(INDEX_PACIENTE, INDEX_PACIENTE, { unique: false })
        store.createIndex(INDEX_CLINICA, INDEX_CLINICA, { unique: false })
      } else if (oldVersion < 2) {
        // F7-36 FASE 1 (Commit 1.6): migración v1 → v2
        // Agregar índice clinicaId y poblar registros existentes con la
        // clínica actual. Si no hay clínica activa, los registros quedan
        // con clinicaId=undefined y serán invisibles en consultas
        // (defensa en profundidad: se limpian al próximo cambio de clínica).
        const store = event.target.transaction.objectStore(STORE_NAME)
        if (!store.indexNames.contains(INDEX_CLINICA)) {
          store.createIndex(INDEX_CLINICA, INDEX_CLINICA, { unique: false })
        }
        const clinicaIdActual = obtenerClinicaId()
        if (clinicaIdActual) {
          const cursorReq = store.openCursor()
          cursorReq.onsuccess = (e) => {
            const cursor = e.target.result
            if (cursor) {
              if (!cursor.value.clinicaId) {
                cursor.update({ ...cursor.value, clinicaId: clinicaIdActual })
              }
              cursor.continue()
            }
          }
        }
      }
    }

    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = () => reject(new Error('No se pudo abrir la base de datos local de adjuntos.'))
  })

  return dbPromise
}

/**
 * Cierra la conexión activa a IndexedDB y resetea dbPromise (útil para testing y cambio de ciclo).
 */
export const cerrarDB = async () => {
  if (dbPromise) {
    try {
      const db = await dbPromise
      db.close()
    } catch {
      // Ignorar errores al cerrar
    }
    dbPromise = null
  }
}

const generarId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

/**
 * Obtiene clinicaId desde sesionStore si está disponible.
 * Retorna null si no hay sesión activa.
 */
const obtenerClinicaId = () => {
  try {
    const estado = useSesionStore.getState()
    return estado.userProfile?.clinicaId || null
  } catch {
    return null
  }
}

/**
 * Obtiene la lista de subidas pendientes para la clínica activa (P0-2).
 */
export const obtenerPendingUploads = () => {
  return pendingUploadsRepo.obtener([]) || []
}

/**
 * Guarda la lista de subidas pendientes para la clínica activa (P0-2).
 */
export const guardarPendingUploads = (pending) => {
  if (!pending || pending.length === 0) {
    pendingUploadsRepo.eliminar()
  } else {
    pendingUploadsRepo.guardar(pending)
  }
}

/**
 * Guarda un adjunto clínico nuevo. `blob` debe ser un File/Blob real
 * (nunca se transforma a URL de memoria dentro de este servicio — eso es
 * responsabilidad de quien consume los datos para mostrarlos).
 *
 * F6-E + P0-2: estrategia dual offline-first con cola de subida diferida:
 * 1. Guardar en IndexedDB primero (síncrono, inmediato)
 * 2. Intentar subir a Supabase (asíncrono)
 * 3. Si Supabase funciona, actualizar registro con storagePath + sincronizado
 * 4. Si Supabase falla o no hay conexión, registrar ID en pendingUploads
 *
 * @param {Object} params
 * @param {string} params.pacienteId — UUID del paciente
 * @param {string} params.tipo — 'foto' | 'rx' | 'consentimiento'
 * @param {Blob|File} params.blob — archivo binario
 * @param {string} params.nombre — nombre original del archivo
 * @param {string} [params.clinicaId] — UUID de la clínica (opcional, se intenta obtener de sesionStore)
 */
export const guardarAdjunto = async ({ pacienteId, tipo, blob, nombre, clinicaId }) => {
  if (!pacienteId) throw new Error('No se puede guardar un adjunto sin pacienteId asociado.')
  // F7-36 FASE 1 (Commit 1.6): clinicaId obligatorio para aislamiento multi-tenant.
  // Sin clinicaId, el adjunto quedaría huérfano y podría contaminar otras clínicas.
  const clinicaIdEfectivo = clinicaId || obtenerClinicaId()
  if (!clinicaIdEfectivo) {
    throw new Error('No se puede guardar un adjunto sin clinicaId (aislamiento multi-tenant).')
  }
  const db = await abrirDB()

  // Paso 1: guardar en IndexedDB inmediatamente (offline-first)
  const registro = {
    id: generarId(),
    pacienteId,
    clinicaId: clinicaIdEfectivo, // F7-36 FASE 1: aislamiento multi-tenant en IndexedDB
    tipo,
    blob,
    nombre,
    fecha: new Date().toISOString(),
    storagePath: null, // F6-E: se llena si Supabase funciona
    sincronizado: false // F6-E: estado de sincronización con Supabase
  }

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add(registro)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(new Error('No se pudo guardar el adjunto en el dispositivo.'))
  })

  // Paso 2: intentar subir a Supabase (asíncrono, no bloquea)
  let subidoExitoso = false
  if (storageDisponible() && clinicaIdEfectivo) {
    try {
      const resultado = await subirAdjunto({
        clinicaId: clinicaIdEfectivo,
        pacienteId,
        tipo,
        blob,
        nombre
      })

      if (resultado?.path) {
        // Actualizar registro en IndexedDB con storagePath
        registro.storagePath = resultado.path
        registro.sincronizado = true

        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put(registro)
        await new Promise((resolve) => {
          tx.oncomplete = () => resolve()
          tx.onerror = () => resolve() // no fallar si no se puede actualizar
        })
        subidoExitoso = true
      }
    } catch (e) {
      log.warn('No se pudo subir a Supabase de inmediato, encolando subida diferida:', e?.message || e)
    }
  }

  // Paso 3 (P0-2): Si no se subió con éxito a Supabase, registrar en la cola diferida
  if (!subidoExitoso) {
    try {
      const pending = obtenerPendingUploads()
      const yaEncolado = pending.some((item) =>
        typeof item === 'string' ? item === registro.id : item.id === registro.id
      )
      if (!yaEncolado) {
        pending.push({
          id: registro.id,
          pacienteId: registro.pacienteId,
          clinicaId: clinicaIdEfectivo,
          fecha: registro.fecha
        })
        guardarPendingUploads(pending)
      }
    } catch (errQueue) {
      log.warn('Error al encolar adjunto en pendingUploads:', errQueue?.message || errQueue)
    }
  }

  return registro
}

/**
 * Obtiene todos los adjuntos de un paciente (todos los tipos, sin filtrar).
 * El consumidor decide cómo agruparlos por `tipo`.
 */
export const obtenerAdjuntosPorPaciente = async (pacienteId) => {
  if (!pacienteId) return []
  const db = await abrirDB()
  // F7-36 FASE 1 (Commit 1.6): filtro por clínica actual como defensa en profundidad.
  // Aunque invalidarCacheCambioClinica borra la BD al cambiar de clínica, este filtro
  // previene contaminación cross-clinic si la limpieza fallara por cualquier razón.
  const clinicaIdActual = obtenerClinicaId()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const index = tx.objectStore(STORE_NAME).index(INDEX_PACIENTE)
    const request = index.getAll(pacienteId)
    request.onsuccess = () => {
      const todos = request.result || []
      if (!clinicaIdActual) {
        // Sin clínica activa, retornar vacío (seguridad: no exponer datos de ninguna clínica)
        resolve([])
        return
      }
      const filtrados = todos.filter((r) => r.clinicaId === clinicaIdActual)
      resolve(filtrados)
    }
    request.onerror = () => reject(new Error('No se pudieron leer los adjuntos del paciente.'))
  })
}

/**
 * Elimina un adjunto puntual por su id.
 * F6-E: también intenta eliminar de Supabase Storage si existe storagePath.
 */
export const eliminarAdjunto = async (id) => {
  const db = await abrirDB()
  
  // Paso 1: leer el registro para obtener storagePath
  let registro = null
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => {
      registro = request.result
      resolve()
    }
    request.onerror = () => reject(new Error('No se pudo leer el adjunto.'))
  })

  // Paso 2: eliminar de IndexedDB
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(new Error('No se pudo eliminar el adjunto.'))
  })

  // Paso 3: intentar eliminar de Supabase si existe storagePath
  if (registro?.storagePath) {
    try {
      await eliminarAdjuntoDeStorage(registro.storagePath)
    } catch (e) {
      log.warn('No se pudo eliminar de Supabase Storage:', e)
    }
  }

  return true
}

/**
 * Elimina todos los adjuntos de un paciente. Se usa al eliminar un paciente
 * completo, para no dejar adjuntos huérfanos en IndexedDB ni en Supabase Storage.
 */
export const eliminarTodosPorPaciente = async (pacienteId) => {
  if (!pacienteId) return true
  const db = await abrirDB()

  // Paso 1: obtener todos los registros para eliminar de Supabase
  const registros = await obtenerAdjuntosPorPaciente(pacienteId)

  // Paso 2: eliminar de IndexedDB
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index(INDEX_PACIENTE)
    const request = index.openCursor(IDBKeyRange.only(pacienteId))

    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        store.delete(cursor.primaryKey)
        cursor.continue()
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(new Error('No se pudieron eliminar los adjuntos del paciente.'))
  })

  // Paso 3: intentar eliminar de Supabase Storage
  if (storageDisponible()) {
    for (const registro of registros) {
      if (registro.storagePath) {
        try {
          await eliminarAdjuntoDeStorage(registro.storagePath)
        } catch (e) {
          log.warn('No se pudo eliminar de Supabase Storage:', registro.storagePath, e)
        }
      }
    }
  }

  return true
}

/**
 * Elimina todos los adjuntos de una clínica específica de la caché local de IndexedDB.
 *
 * P0-2:
 * 1. NUNCA invoca eliminarAdjuntoDeStorage (la limpieza de caché local jamás destruye
 *    los archivos remotos en Supabase Storage).
 * 2. Si soloSincronizados es true, preserva intactos los registros que tengan
 *    sincronizado === false (evita pérdida de datos offline).
 *
 * @param {string} clinicaId — UUID de la clínica cuyos adjuntos se eliminarán
 * @param {Object} [opciones]
 * @param {boolean} [opciones.soloSincronizados=false] - Si es true, solo borra los ya subidos a Supabase
 * @returns {Promise<number>} Cantidad de adjuntos eliminados
 */
export const eliminarAdjuntosPorClinica = async (clinicaId, { soloSincronizados = false } = {}) => {
  if (!clinicaId) return 0
  const db = await abrirDB()
  let eliminados = 0

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index(INDEX_CLINICA)
    const request = index.openCursor(IDBKeyRange.only(clinicaId))

    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        const registro = cursor.value
        // Si se pide solo sincronizados, proteger los pendientes offline
        if (soloSincronizados && !registro.sincronizado) {
          cursor.continue()
          return
        }
        // P0-2: Limpieza local pura. NUNCA llamar a eliminarAdjuntoDeStorage
        store.delete(cursor.primaryKey)
        eliminados++
        cursor.continue()
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(new Error('No se pudieron eliminar los adjuntos de la clínica.'))
  })

  return eliminados
}

/**
 * Invalidación segura de caché de adjuntos al cambiar de clínica (P0-2).
 * Reemplaza la eliminación destructiva de la base completa (indexedDB.deleteDatabase).
 * Solo remueve de la clínica anterior los adjuntos que ya están respaldados en la nube
 * (sincronizado: true). NUNCA borra adjuntos offline pendientes de subida ni toca Supabase.
 *
 * @param {string} clinicaId - ID de la clínica que deja de estar activa
 * @returns {Promise<{eliminados: number, conservadosPendientes: boolean}>}
 */
export const invalidarCacheAdjuntos = async (clinicaId) => {
  if (!clinicaId) return { eliminados: 0, conservadosPendientes: true }
  try {
    const eliminados = await eliminarAdjuntosPorClinica(clinicaId, { soloSincronizados: true })
    return { eliminados, conservadosPendientes: true }
  } catch (e) {
    log.error('Error al invalidar caché de adjuntos:', e)
    return { eliminados: 0, conservadosPendientes: true, error: e.message }
  }
}

/**
 * Procesa la cola de subidas pendientes para la clínica activa (P0-2).
 * Sube a Supabase Storage y actualiza registros en IndexedDB a sincronizado: true.
 *
 * @returns {Promise<{subidos: number, fallidos: number}>}
 */
export const procesarColaSubidas = async () => {
  const clinicaIdActual = obtenerClinicaId()
  if (!clinicaIdActual) {
    return { subidos: 0, fallidos: 0, razon: 'sin-clinica' }
  }

  if (!storageDisponible()) {
    return { subidos: 0, fallidos: 0, offline: true }
  }

  const pending = obtenerPendingUploads()
  if (!pending || pending.length === 0) {
    return { subidos: 0, fallidos: 0 }
  }

  const db = await abrirDB()
  let subidos = 0
  let fallidos = 0
  const procesadosExitosos = []

  for (const item of pending) {
    const id = typeof item === 'string' ? item : item.id
    if (!id) continue

    try {
      // 1. Obtener registro binario desde IndexedDB
      const registro = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(id)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(new Error('No se pudo leer el registro de IndexedDB'))
      })

      if (!registro) {
        // El registro ya no existe en IndexedDB, descartar de la cola
        procesadosExitosos.push(id)
        continue
      }

      // Aislamiento multi-tenant: procesar solo si pertenece a la clínica activa
      if (registro.clinicaId !== clinicaIdActual) {
        continue
      }

      if (registro.sincronizado && registro.storagePath) {
        procesadosExitosos.push(id)
        continue
      }

      // 2. Subir a Supabase Storage
      const resultado = await subirAdjunto({
        clinicaId: registro.clinicaId,
        pacienteId: registro.pacienteId,
        tipo: registro.tipo,
        blob: registro.blob,
        nombre: registro.nombre
      })

      if (resultado?.path) {
        registro.storagePath = resultado.path
        registro.sincronizado = true

        await new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          tx.objectStore(STORE_NAME).put(registro)
          tx.oncomplete = () => resolve()
          tx.onerror = () => resolve()
        })

        procesadosExitosos.push(id)
        subidos++
      } else {
        fallidos++
      }
    } catch (e) {
      log.warn(`Error al subir adjunto pendiente ${id}:`, e?.message || e)
      fallidos++
    }
  }

  // 3. Limpiar de la cola los exitosos
  if (procesadosExitosos.length > 0) {
    const restantes = pending.filter((item) => {
      const id = typeof item === 'string' ? item : item.id
      return !procesadosExitosos.includes(id)
    })
    guardarPendingUploads(restantes)
  }

  return { subidos, fallidos }
}

/**
 * Escanea IndexedDB en busca de adjuntos con sincronizado: false y los agrega
 * a pendingUploads de la clínica correspondiente (P0-2, Migración inicial).
 *
 * @returns {Promise<{encolados: number}>}
 */
export const escanearYSincronizarAdjuntosPendientes = async () => {
  const clinicaIdActual = obtenerClinicaId()
  if (!clinicaIdActual) return { encolados: 0 }

  try {
    const db = await abrirDB()
    const registrosNoSincronizados = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const index = store.index(INDEX_CLINICA)
      const req = index.getAll(clinicaIdActual)
      req.onsuccess = () => {
        const todos = req.result || []
        const pendientes = todos.filter((r) => !r.sincronizado || !r.storagePath)
        resolve(pendientes)
      }
      req.onerror = () => reject(new Error('Error al escanear IndexedDB'))
    })

    if (registrosNoSincronizados.length > 0) {
      const pending = obtenerPendingUploads()
      const idsExistentes = new Set(
        pending.map((item) => (typeof item === 'string' ? item : item.id))
      )

      let nuevos = 0
      for (const reg of registrosNoSincronizados) {
        if (!idsExistentes.has(reg.id)) {
          pending.push({
            id: reg.id,
            pacienteId: reg.pacienteId,
            clinicaId: reg.clinicaId,
            fecha: reg.fecha
          })
          idsExistentes.add(reg.id)
          nuevos++
        }
      }

      if (nuevos > 0) {
        guardarPendingUploads(pending)
      }
    }

    if (storageDisponible()) {
      await procesarColaSubidas()
    }

    return { encolados: registrosNoSincronizados.length }
  } catch (e) {
    log.error('Error al escanear adjuntos pendientes:', e)
    return { encolados: 0, error: e.message }
  }
}
