/**
 * Servicio de persistencia de adjuntos clínicos binarios — Studio Dental
 * Tarea MASTER_ROADMAP: F1-02
 *
 * REGLA DE ARQUITECTURA (Constitución, Cap. V.1): archivos binarios
 * (fotografías clínicas, radiografías, consentimientos informados firmados)
 * se persisten en IndexedDB, nunca en localStorage (límite de 5MB) ni en
 * memoria de React (se pierden al refrescar la página).
 *
 * Ningún componente accede a IndexedDB directamente — toda la app pasa por
 * este servicio (Cap. III de la Constitución).
 */

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
 * Guarda un adjunto clínico nuevo. `blob` debe ser un File/Blob real
 * (nunca se transforma a URL de memoria dentro de este servicio — eso es
 * responsabilidad de quien consume los datos para mostrarlos).
 */
export const guardarAdjunto = async ({ pacienteId, tipo, blob, nombre }) => {
  if (!pacienteId) throw new Error('No se puede guardar un adjunto sin pacienteId asociado.')
  const db = await abrirDB()

  const registro = {
    id: generarId(),
    pacienteId,
    tipo, // 'foto' | 'rx' | 'consentimiento'
    blob,
    nombre,
    fecha: new Date().toISOString()
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add(registro)
    tx.oncomplete = () => resolve(registro)
    tx.onerror = () => reject(new Error('No se pudo guardar el adjunto en el dispositivo.'))
  })
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
 */
export const eliminarAdjunto = async (id) => {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(new Error('No se pudo eliminar el adjunto.'))
  })
}

/**
 * Elimina todos los adjuntos de un paciente. Se usa al eliminar un paciente
 * completo, para no dejar adjuntos huérfanos en IndexedDB.
 */
export const eliminarTodosPorPaciente = async (pacienteId) => {
  if (!pacienteId) return true
  const db = await abrirDB()

  return new Promise((resolve, reject) => {
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
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(new Error('No se pudieron eliminar los adjuntos del paciente.'))
  })
}