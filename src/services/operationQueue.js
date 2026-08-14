/**
 * Cola de operaciones offline-first (F5-03).
 *
 * Gestiona operaciones pendientes cuando no hay conexión a Supabase.
 * Las operaciones se persisten en localStorage y se procesan automáticamente
 * cuando vuelve la conexión.
 *
 * API pública:
 * - enqueue(operation) → agrega operación a la cola
 * - processQueue() → procesa todas las operaciones pendientes
 * - getPendingCount() → número de operaciones pendientes
 * - clear() → limpia la cola (útil para testing)
 *
 * Estructura de operación:
 * {
 *   id: string (UUID),
 *   timestamp: number (Date.now()),
 *   service: string (nombre del storage service),
 *   method: string (método a invocar),
 *   args: array (argumentos del método),
 *   retries: number (intentos realizados)
 * }
 *
 * Estrategia de retry exponencial:
 * - Intento 1: 0s (inmediato)
 * - Intento 2: 1s
 * - Intento 3: 2s
 * - Intento 4: 4s
 * - Intento 5: 8s (máximo)
 * - Después de 5 fallos: moved to failed_operations (log)
 */

import { estaOnline } from './supabaseClient'

const QUEUE_KEY = 'studio_dental_operation_queue'
const FAILED_KEY = 'studio_dental_failed_operations'
const MAX_RETRIES = 5
const RETRY_DELAYS = [0, 1000, 2000, 4000, 8000] // ms

/**
 * Lock simple para prevenir procesamiento concurrente.
 */
let processing = false

/**
 * Genera un ID único para cada operación.
 */
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Lee la cola desde localStorage.
 */
const readQueue = () => {
  try {
    const data = localStorage.getItem(QUEUE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('[operationQueue] Error leyendo cola:', e)
    return []
  }
}

/**
 * Escribe la cola en localStorage.
 */
const writeQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.error('[operationQueue] Error escribiendo cola:', e)
  }
}

/**
 * Mueve una operación fallida a failed_operations (log).
 */
const moveToFailed = (operation, error) => {
  try {
    const failed = JSON.parse(localStorage.getItem(FAILED_KEY) || '[]')
    failed.push({
      ...operation,
      failedAt: Date.now(),
      error: error?.message || 'Unknown error'
    })
    localStorage.setItem(FAILED_KEY, JSON.stringify(failed))
    console.error('[operationQueue] Operación fallida después de máximos reintentos:', operation, error)
  } catch (e) {
    console.error('[operationQueue] Error moviendo a failed:', e)
  }
}

/**
 * Resuelve el storage service y método a invocar.
 * Retorna null si el service o método no existe.
 */
// Import estático de storage services (evita INEFFECTIVE_DYNAMIC_IMPORT)
import { pacientesStorageService } from '../modules/pacientes/services/pacientesStorageService'
import { agendaStorageService } from '../modules/agenda/services/agendaStorageService'
import { presupuestosStorageService } from '../modules/presupuestos/services/presupuestosStorageService'
import { pagosStorageService } from '../modules/pagos/services/pagosStorageService'
import { finanzasStorageService } from '../modules/finanzas/services/finanzasStorageService'

const STORAGE_SERVICES = {
  pacientesStorageService,
  agendaStorageService,
  presupuestosStorageService,
  pagosStorageService,
  finanzasStorageService
}

const resolveServiceMethod = (serviceName, methodName) => {
  const service = STORAGE_SERVICES[serviceName]
  if (!service) {
    console.error('[operationQueue] Service no reconocido:', serviceName)
    return null
  }

  if (typeof service[methodName] !== 'function') {
    console.error('[operationQueue] Método no encontrado:', serviceName, methodName)
    return null
  }

  return service[methodName].bind(service)
}

/**
 * Procesa una sola operación con retry exponencial.
 * Retorna true si fue exitosa, false si falló permanentemente.
 */
const processOperation = async (operation) => {
  const method = resolveServiceMethod(operation.service, operation.method)
  if (!method) {
    moveToFailed(operation, new Error('Service o método no encontrado'))
    return false
  }

  const maxAttempts = MAX_RETRIES
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await method(...operation.args)
      return true
    } catch (error) {
      operation.retries = (operation.retries || 0) + 1
      console.warn(`[operationQueue] Intento ${attempt + 1} falló:`, error.message)

      if (attempt < maxAttempts - 1) {
        // Esperar antes del próximo intento
        const delay = RETRY_DELAYS[attempt] || 8000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Todos los intentos fallaron
  moveToFailed(operation, new Error('Máximos reintentos alcanzados'))
  return false
}

/**
 * Encola una operación para procesamiento posterior.
 *
 * @param {Object} operation - Operación a encolar
 * @param {string} operation.service - Nombre del storage service
 * @param {string} operation.method - Método a invocar
 * @param {Array} operation.args - Argumentos del método
 * @returns {string} ID de la operación encolada
 */
export const enqueue = (operation) => {
  const id = generateId()
  const queue = readQueue()

  queue.push({
    id,
    timestamp: Date.now(),
    service: operation.service,
    method: operation.method,
    args: operation.args || [],
    retries: 0
  })

  writeQueue(queue)
  console.log(`[operationQueue] Operación encolada: ${operation.service}.${operation.method} (ID: ${id})`)
  return id
}

/**
 * Procesa todas las operaciones pendientes en la cola.
 * Solo procesa si está online y no hay otro procesamiento en curso.
 */
export const processQueue = async () => {
  if (processing) {
    console.log('[operationQueue] Ya hay procesamiento en curso, omitiendo')
    return
  }

  const online = await estaOnline()
  if (!online) {
    console.log('[operationQueue] Offline, no se procesa la cola')
    return
  }

  const queue = readQueue()
  if (queue.length === 0) {
    return
  }

  processing = true
  console.log(`[operationQueue] Procesando ${queue.length} operaciones pendientes...`)

  for (const operation of queue) {
    const success = await processOperation(operation)
    if (!success) {
      // Si falló permanentemente, no la dejamos en la cola
      // (ya fue movida a failed_operations)
    }
  }

  // Limpiar cola (todas fueron procesadas o movidas a failed)
  writeQueue([])
  processing = false
  console.log('[operationQueue] Cola procesada completamente')
}

/**
 * Retorna el número de operaciones pendientes.
 */
export const getPendingCount = () => {
  return readQueue().length
}

/**
 * Limpia la cola completamente (útil para testing).
 */
export const clear = () => {
  writeQueue([])
  console.log('[operationQueue] Cola limpiada')
}

/**
 * Servicio exportado como objeto para consistencia.
 */
export const operationQueue = {
  enqueue,
  processQueue,
  getPendingCount,
  clear
}
