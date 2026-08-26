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
import { createLogger } from './logger'

const log = createLogger('adjuntosStorageService')

const DB_NAME = 'studio_dental_adjuntos'
const DB_VERSION = 1
const STORE_NAME = 'adjuntos'
const INDEX_PACIENTE = 'pacienteId'

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex(INDEX_PACIENTE, INDEX_PACIENTE, { unique: false })
      }
    }

    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = () => reject(new Error('No se pudo abrir la base de datos local de adjuntos.'))
  })

  return dbPromise
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
 * Guarda un adjunto clínico nuevo. `blob` debe ser un File/Blob real
 * (nunca se transforma a URL de memoria dentro de este servicio — eso es
 * responsabilidad de quien consume los datos para mostrarlos).
 *
 * F6-E: estrategia dual offline-first:
 * 1. Guardar en IndexedDB primero (síncrono, inmediato)
 * 2. Intentar subir a Supabase (asíncrono, puede fallar)
 * 3. Si Supabase funciona, actualizar registro con storagePath + sincronizado
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
  const db = await abrirDB()

  // Paso 1: guardar en IndexedDB inmediatamente (offline-first)
  const registro = {
    id: generarId(),
    pacienteId,
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
  if (storageDisponible()) {
    const clinicaIdEfectivo = clinicaId || obtenerClinicaId()
    
    if (clinicaIdEfectivo) {
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
        }
      } catch (e) {
        log.warn('No se pudo subir a Supabase, adjunto queda solo en IndexedDB:', e)
      }
    } else {
      log.warn('No hay clinicaId disponible, adjunto queda solo en IndexedDB')
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

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const index = tx.objectStore(STORE_NAME).index(INDEX_PACIENTE)
    const request = index.getAll(pacienteId)
    request.onsuccess = () => resolve(request.result || [])
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
