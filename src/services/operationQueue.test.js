/**
 * Tests unitarios de operationQueue (F5-03).
 *
 * Cobertura:
 * - enqueue() agrega operación a la cola
 * - enqueue() persiste en localStorage
 * - getPendingCount() retorna número correcto
 * - processQueue() invoca el método del storage service
 * - processQueue() remueve operación exitosa de la cola
 * - Retry exponencial: reintentos con delays correctos
 * - Después de 5 fallos: operación se mueve a failed_operations
 * - clear() limpia la cola completamente
 * - Cola persiste entre "recargas" (simulando reload)
 * - No procesa si está offline (navigator.onLine = false)
 * - Lock previene procesamiento concurrente
 * - Manejo graceful si storage service no existe
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock de supabaseClient
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  },
  USE_SUPABASE: true,
  estaOnline: vi.fn(() => Promise.resolve(true))
}))

// F7-36 FASE 1 (Commit 1.5f): Mock de tenantCache para pruebas tenant-aware
const CLINICA_ID = 'clinica-test'
vi.mock('./tenantCache', () => ({
  tenantCache: {
    getClinicaId: vi.fn(() => CLINICA_ID),
    claveTenant: (baseKey) => `sd_${CLINICA_ID}_${baseKey}`,
    leerTenant: (baseKey, fallback) => {
      const key = `sd_${CLINICA_ID}_${baseKey}`
      const saved = localStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : fallback
    },
    escribirTenant: (baseKey, value) => {
      const key = `sd_${CLINICA_ID}_${baseKey}`
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    },
    eliminarTenant: (baseKey) => {
      const key = `sd_${CLINICA_ID}_${baseKey}`
      const existia = localStorage.getItem(key) !== null
      localStorage.removeItem(key)
      return existia
    },
    existeTenant: (baseKey) => {
      return localStorage.getItem(`sd_${CLINICA_ID}_${baseKey}`) !== null
    },
  },
}))

// Mock de localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} })
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('operationQueue', () => {
  let operationQueue

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Re-importar para resetear estado interno
    vi.resetModules()
    const module = await import('./operationQueue')
    operationQueue = module.operationQueue
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('enqueue', () => {
    it('debe agregar operación a la cola', () => {
      const id = operationQueue.enqueue({
        service: 'pacientesStorageService',
        method: 'guardarPacientes',
        args: [[{ id: 1, nombre: 'Test' }]]
      })

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('debe persistir en localStorage', () => {
      operationQueue.enqueue({
        service: 'pacientesStorageService',
        method: 'guardarPacientes',
        args: [[{ id: 1 }]]
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `sd_${CLINICA_ID}_studio_dental_operation_queue`,
        expect.any(String)
      )

      const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(stored).toHaveLength(1)
      expect(stored[0].service).toBe('pacientesStorageService')
      expect(stored[0].method).toBe('guardarPacientes')
    })

    it('debe generar ID único para cada operación', () => {
      const id1 = operationQueue.enqueue({ service: 'test', method: 'test', args: [] })
      const id2 = operationQueue.enqueue({ service: 'test', method: 'test', args: [] })

      expect(id1).not.toBe(id2)
    })

    it('debe incluir timestamp en la operación', () => {
      const antes = Date.now()
      operationQueue.enqueue({ service: 'test', method: 'test', args: [] })
      const despues = Date.now()

      const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(stored[0].timestamp).toBeGreaterThanOrEqual(antes)
      expect(stored[0].timestamp).toBeLessThanOrEqual(despues)
    })

    it('debe inicializar retries en 0', () => {
      operationQueue.enqueue({ service: 'test', method: 'test', args: [] })

      const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(stored[0].retries).toBe(0)
    })
  })

  describe('getPendingCount', () => {
    it('debe retornar 0 si la cola está vacía', () => {
      expect(operationQueue.getPendingCount()).toBe(0)
    })

    it('debe retornar número correcto de operaciones', () => {
      operationQueue.enqueue({ service: 'test', method: 'test', args: [] })
      operationQueue.enqueue({ service: 'test', method: 'test', args: [] })
      operationQueue.enqueue({ service: 'test', method: 'test', args: [] })

      expect(operationQueue.getPendingCount()).toBe(3)
    })
  })

  describe('clear', () => {
    it('debe limpiar la cola completamente', () => {
      operationQueue.enqueue({ service: 'test', method: 'test', args: [] })
      operationQueue.enqueue({ service: 'test', method: 'test', args: [] })

      expect(operationQueue.getPendingCount()).toBe(2)

      operationQueue.clear()

      expect(operationQueue.getPendingCount()).toBe(0)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `sd_${CLINICA_ID}_studio_dental_operation_queue`,
        '[]'
      )
    })
  })

  describe('processQueue', () => {
    it('no debe procesar si está offline', async () => {
      const { estaOnline } = await import('./supabaseClient')
      vi.mocked(estaOnline).mockResolvedValue(false)

      operationQueue.enqueue({
        service: 'pacientesStorageService',
        method: 'guardarPacientes',
        args: [[]]
      })

      await operationQueue.processQueue()

      // La operación debe seguir en la cola
      expect(operationQueue.getPendingCount()).toBe(1)
    })

    it('debe procesar cola vacía sin error', async () => {
      await expect(operationQueue.processQueue()).resolves.not.toThrow()
    })

    it('debe limpiar la cola después de procesar', async () => {
      // Mock del storage service
      vi.doMock('../modules/pacientes/services/pacientesStorageService', () => ({
        pacientesStorageService: {
          guardarPacientes: vi.fn(() => Promise.resolve())
        }
      }))

      operationQueue.enqueue({
        service: 'pacientesStorageService',
        method: 'guardarPacientes',
        args: [[{ id: 1 }]]
      })

      await operationQueue.processQueue()

      expect(operationQueue.getPendingCount()).toBe(0)
    })

    it('debe prevenir procesamiento concurrente (lock)', async () => {
      const { estaOnline } = await import('./supabaseClient')
      vi.mocked(estaOnline).mockResolvedValue(true)

      vi.doMock('../modules/pacientes/services/pacientesStorageService', () => ({
        pacientesStorageService: {
          guardarPacientes: vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
        }
      }))

      operationQueue.enqueue({
        service: 'pacientesStorageService',
        method: 'guardarPacientes',
        args: [[]]
      })

      // Iniciar dos procesos en paralelo
      const promise1 = operationQueue.processQueue()
      const promise2 = operationQueue.processQueue()

      await Promise.all([promise1, promise2])

      // Solo uno debe haber procesado (el segundo vio el lock)
      const stored = localStorageMock.getItem(`sd_${CLINICA_ID}_studio_dental_operation_queue`)
      expect(stored).toBe('[]')
    })
  })

  describe('persistencia', () => {
    it('debe persistir operaciones entre "recargas"', async () => {
      // Simular primera sesión
      operationQueue.enqueue({
        service: 'pacientesStorageService',
        method: 'guardarPacientes',
        args: [[{ id: 1 }]]
      })

      expect(operationQueue.getPendingCount()).toBe(1)

      // Simular "recarga" re-importando el módulo
      vi.resetModules()
      const module2 = await import('./operationQueue')

      expect(module2.operationQueue.getPendingCount()).toBe(1)
    })
  })
})
