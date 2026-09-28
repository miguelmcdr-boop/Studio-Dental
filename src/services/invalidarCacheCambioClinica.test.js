/**
 * Tests de invalidarCacheCambioClinica — F7-36 FASE 1 (Commit 1.3)
 *
 * Cubre los 5 pasos fail-safe:
 *   1. tenantCache (claves tenant-aware)
 *   2. 4 storage services (cache en memoria)
 *   3. 2 stores Zustand
 *   4. claves legacy localStorage
 *   5. IndexedDB
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock de tenantCache
vi.mock('./tenantCache', () => ({
  tenantCache: {
    invalidarClinica: vi.fn(() => 5),
    invalidarTodas: vi.fn(() => 10),
  },
}))

// Mock de los 4 storage services
vi.mock('../modules/finanzas/services/finanzasStorageService', () => ({
  finanzasStorageService: { resetCache: vi.fn() },
}))
vi.mock('../modules/agenda/services/agendaStorageService', () => ({
  agendaStorageService: { resetCache: vi.fn() },
}))
vi.mock('../modules/pagos/services/pagosStorageService', () => ({
  pagosStorageService: { resetCache: vi.fn() },
}))
vi.mock('../modules/presupuestos/services/presupuestosStorageService', () => ({
  presupuestosStorageService: { resetCache: vi.fn() },
}))

// Mock de stores Zustand
vi.mock('../store/pacientesStore', () => ({
  usePacientesStore: { setState: vi.fn() },
}))
vi.mock('../store/prestacionesStore', () => ({
  usePrestacionesStore: { setState: vi.fn() },
}))

// Importar mocks y servicio
import { tenantCache } from './tenantCache'
import { finanzasStorageService } from '../modules/finanzas/services/finanzasStorageService'
import { agendaStorageService } from '../modules/agenda/services/agendaStorageService'
import { pagosStorageService } from '../modules/pagos/services/pagosStorageService'
import { presupuestosStorageService } from '../modules/presupuestos/services/presupuestosStorageService'
import { usePacientesStore } from '../store/pacientesStore'
import { usePrestacionesStore } from '../store/prestacionesStore'
import { invalidarCacheCambioClinica } from './invalidarCacheCambioClinica'

/**
 * Crea un mock de indexedDB.deleteDatabase que llama al callback correcto.
 * @param {'success' | 'error' | 'blocked'} resultado - Qué callback invocar
 */
const mockIndexedDB = (resultado = 'success') => {
  global.indexedDB = {
    deleteDatabase: vi.fn((dbName) => {
      const request = {
        onsuccess: null,
        onerror: null,
        onblocked: null,
      }
      // Usar queueMicrotask para llamar al callback después de que se asignen
      queueMicrotask(() => {
        if (resultado === 'success' && request.onsuccess) {
          request.onsuccess({ target: { result: undefined } })
        } else if (resultado === 'error' && request.onerror) {
          request.onerror({ target: { error: new Error('DB error') } })
        } else if (resultado === 'blocked' && request.onblocked) {
          request.onblocked()
        }
      })
      return request
    }),
  }
}

describe('invalidarCacheCambioClinica', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockIndexedDB('success')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Paso 1: tenantCache', () => {
    it('llama a invalidarClinica() con el ID de clínica anterior', async () => {
      const result = await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(tenantCache.invalidarClinica).toHaveBeenCalledWith('clinica-uuid-123')
      expect(result.tenantKeys).toBe(5)
    })

    it('usa invalidarTodas() cuando no hay clínica anterior', async () => {
      const result = await invalidarCacheCambioClinica(null)
      expect(tenantCache.invalidarTodas).toHaveBeenCalled()
      expect(result.tenantKeys).toBe(10)
    })

    it('continúa aunque tenantCache falle', async () => {
      tenantCache.invalidarClinica.mockImplementation(() => {
        throw new Error('Tenant error')
      })
      const result = await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(result.tenantKeys).toBe(0)
      // Los otros pasos deben continuar
      expect(result.storageServices).toBeGreaterThan(0)
    })
  })

  describe('Paso 2: 4 storage services', () => {
    it('llama a resetCache() de los 4 servicios', async () => {
      await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(finanzasStorageService.resetCache).toHaveBeenCalled()
      expect(agendaStorageService.resetCache).toHaveBeenCalled()
      expect(pagosStorageService.resetCache).toHaveBeenCalled()
      expect(presupuestosStorageService.resetCache).toHaveBeenCalled()
    })

    it('cuenta correctamente los servicios reseteados', async () => {
      const result = await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(result.storageServices).toBe(4)
    })

    it('continúa aunque un servicio falle', async () => {
      finanzasStorageService.resetCache.mockImplementation(() => {
        throw new Error('Service error')
      })
      const result = await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(result.storageServices).toBe(3) // 3 de 4 exitosos
      // Los otros servicios deben continuar
      expect(agendaStorageService.resetCache).toHaveBeenCalled()
    })
  })

  describe('Paso 3: stores Zustand', () => {
    it('resetea pacientesStore y prestacionesStore', async () => {
      await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(usePacientesStore.setState).toHaveBeenCalledWith({ pacientes: [] })
      expect(usePrestacionesStore.setState).toHaveBeenCalledWith({ prestacionesArancel: [] })
    })

    it('retorna nombres de stores reseteados', async () => {
      const result = await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(result.stores).toContain('pacientesStore')
      expect(result.stores).toContain('prestacionesStore')
      expect(result.stores).toHaveLength(2)
    })

    it('continúa aunque un store falle', async () => {
      usePacientesStore.setState.mockImplementation(() => {
        throw new Error('Store error')
      })
      const result = await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(result.stores).toHaveLength(1) // Solo prestacionesStore
      expect(result.stores).toContain('prestacionesStore')
    })
  })

  describe('Paso 4: claves legacy localStorage', () => {
    it('elimina claves con prefijo studio_dental_', async () => {
      localStorage.setItem('studio_dental_pacientes', 'datos')
      localStorage.setItem('studio_dental_citas', 'datos')
      localStorage.setItem('darkMode', 'true') // No debe eliminarse
      localStorage.setItem('otro_prefijo', 'datos') // No debe eliminarse

      const result = await invalidarCacheCambioClinica('clinica-uuid-123')

      expect(result.legacyKeys).toBe(2)
      expect(localStorage.getItem('studio_dental_pacientes')).toBeNull()
      expect(localStorage.getItem('studio_dental_citas')).toBeNull()
      expect(localStorage.getItem('darkMode')).toBe('true') // Preservado
      expect(localStorage.getItem('otro_prefijo')).toBe('datos') // Preservado
    })

    it('cuenta correctamente las claves eliminadas', async () => {
      localStorage.setItem('studio_dental_a', '1')
      localStorage.setItem('studio_dental_b', '2')
      localStorage.setItem('studio_dental_c', '3')

      const result = await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(result.legacyKeys).toBe(3)
    })
  })

  describe('Paso 5: IndexedDB', () => {
    it('elimina la base de datos studio_dental_adjuntos', async () => {
      const result = await invalidarCacheCambioClinica('clinica-uuid-123')

      expect(global.indexedDB.deleteDatabase).toHaveBeenCalledWith('studio_dental_adjuntos')
      expect(result.indexedDB.eliminada).toBe(true)
    })

    it('maneja correctamente cuando indexedDB no está disponible', async () => {
      delete global.indexedDB

      const result = await invalidarCacheCambioClinica('clinica-uuid-123')

      expect(result.indexedDB.eliminada).toBe(false)
      expect(result.indexedDB.razon).toBe('indexedDB no disponible')
    })

    it('cuenta como error si indexedDB falla', async () => {
      mockIndexedDB('error')

      const result = await invalidarCacheCambioClinica('clinica-uuid-123')

      expect(result.indexedDB.eliminada).toBe(false)
      expect(result.errores).toBe(1)
    })

    it('maneja correctamente el estado blocked', async () => {
      mockIndexedDB('blocked')

      const result = await invalidarCacheCambioClinica('clinica-uuid-123')

      // Blocked no es un error crítico, se resuelve exitosamente
      expect(result.indexedDB.eliminada).toBe(true)
      expect(result.errores).toBe(0)
    })
  })

  describe('Resumen estructurado', () => {
    it('retorna resumen completo con todos los conteos', async () => {
      localStorage.setItem('studio_dental_legacy', 'datos')

      const result = await invalidarCacheCambioClinica('clinica-uuid-123')

      expect(result).toHaveProperty('tenantKeys')
      expect(result).toHaveProperty('storageServices')
      expect(result).toHaveProperty('stores')
      expect(result).toHaveProperty('legacyKeys')
      expect(result).toHaveProperty('indexedDB')
      expect(result).toHaveProperty('errores')

      expect(typeof result.tenantKeys).toBe('number')
      expect(typeof result.storageServices).toBe('number')
      expect(Array.isArray(result.stores)).toBe(true)
      expect(typeof result.legacyKeys).toBe('number')
      expect(typeof result.indexedDB).toBe('object')
      expect(typeof result.errores).toBe('number')
    })

    it('errores es 0 cuando todos los pasos son exitosos', async () => {
      const result = await invalidarCacheCambioClinica('clinica-uuid-123')
      expect(result.errores).toBe(0)
    })
  })

  describe('Fail-safe behavior', () => {
    it('todos los pasos continúan aunque uno falle', async () => {
      // Hacer fallar pasos 1, 2, 3
      tenantCache.invalidarClinica.mockImplementation(() => {
        throw new Error('Tenant error')
      })
      finanzasStorageService.resetCache.mockImplementation(() => {
        throw new Error('Service error')
      })
      usePacientesStore.setState.mockImplementation(() => {
        throw new Error('Store error')
      })

      const result = await invalidarCacheCambioClinica('clinica-uuid-123')

      // Paso 4 (legacy) y 5 (IndexedDB) deben continuar
      expect(result.legacyKeys).toBeGreaterThanOrEqual(0)
      expect(result.indexedDB).toBeDefined()

      // Los otros storage services deben continuar
      expect(agendaStorageService.resetCache).toHaveBeenCalled()
      expect(pagosStorageService.resetCache).toHaveBeenCalled()
      expect(presupuestosStorageService.resetCache).toHaveBeenCalled()

      // El otro store debe continuar
      expect(usePrestacionesStore.setState).toHaveBeenCalled()
    })
  })
})
