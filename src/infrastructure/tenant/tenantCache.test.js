/**
 * Tests de tenantCache.js — Aislamiento de caché por clínica (F7-36 FASE 1)
 *
 * Cubre:
 * - Generación de claves tenant-aware
 * - Lectura/escritura/eliminación segura
 * - Fail-safe cuando no hay clínica activa
 * - Aislamiento estricto entre clínicas (A vs B)
 * - Invalidación por clínica y global
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTenantCache } from './tenantCache'

/**
 * Crea un mock de localStorage compatible con Object.keys(localStorage).
 * Las claves de storage se exponen como propiedades propias enumerables,
 * igual que en el navegador real.
 */
const createMockLocalStorage = () => {
  const storage = {}

  const api = {
    getItem: vi.fn((key) => (key in storage ? storage[key] : null)),
    setItem: vi.fn((key, value) => { storage[key] = String(value) }),
    removeItem: vi.fn((key) => { delete storage[key] }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach((k) => delete storage[k])
    }),
    key: vi.fn((i) => Object.keys(storage)[i] ?? null),
  }

  Object.defineProperty(api, 'length', {
    get: () => Object.keys(storage).length,
    enumerable: false,
    configurable: true,
  })

  return new Proxy(api, {
    ownKeys: () => Object.keys(storage),
    getOwnPropertyDescriptor: (_target, prop) => {
      if (prop in storage) {
        return { value: storage[prop], enumerable: true, configurable: true, writable: true }
      }
      if (prop in api) {
        return { value: api[prop], enumerable: false, configurable: true, writable: true }
      }
      return undefined
    },
    get: (target, prop) => {
      if (typeof prop === 'string' && prop in storage) return storage[prop]
      return target[prop]
    },
    set: (_target, prop, value) => {
      storage[prop] = value
      return true
    },
  })
}

describe('tenantCache', () => {
  let mockClinicaId
  let cache

  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockLocalStorage())
    mockClinicaId = 'clinica-uuid-A'
    cache = createTenantCache(() => mockClinicaId)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('claveTenant', () => {
    it('genera clave con formato sd_<clinicaId>_<baseKey>', () => {
      expect(cache.claveTenant('pacientes_v3')).toBe('sd_clinica-uuid-A_pacientes_v3')
    })

    it('lanza error si no hay clínica activa', () => {
      const sinClinica = createTenantCache(() => null)
      expect(() => sinClinica.claveTenant('pacientes_v3'))
        .toThrow(/no hay clínica activa/)
    })

    it('lanza error si clínica es string vacío', () => {
      const vacia = createTenantCache(() => '')
      expect(() => vacia.claveTenant('pacientes_v3'))
        .toThrow(/no hay clínica activa/)
    })
  })

  describe('leerTenant / escribirTenant', () => {
    it('escribe y lee datos correctamente', () => {
      const datos = [{ id: 1, nombre: 'Juan' }, { id: 2, nombre: 'María' }]
      expect(cache.escribirTenant('pacientes_v3', datos)).toBe(true)
      expect(cache.leerTenant('pacientes_v3')).toEqual(datos)
    })

    it('retorna fallback cuando la clave no existe', () => {
      expect(cache.leerTenant('inexistente', [])).toEqual([])
      expect(cache.leerTenant('inexistente', null)).toBeNull()
      expect(cache.leerTenant('inexistente')).toBeNull()
    })

    it('retorna fallback cuando el JSON está corrupto', () => {
      localStorage.setItem('sd_clinica-uuid-A_corrupto', '{json inválido')
      expect(cache.leerTenant('corrupto', 'fallback')).toBe('fallback')
    })

    it('escribe JSON serializado (no raw)', () => {
      cache.escribirTenant('test', { a: 1 })
      expect(localStorage.getItem('sd_clinica-uuid-A_test')).toBe('{"a":1}')
    })
  })

  describe('existeTenant / eliminarTenant', () => {
    it('existeTenant retorna true si existe la clave', () => {
      cache.escribirTenant('test', 'valor')
      expect(cache.existeTenant('test')).toBe(true)
    })

    it('existeTenant retorna false si no existe', () => {
      expect(cache.existeTenant('inexistente')).toBe(false)
    })

    it('eliminarTenant elimina la clave y retorna true', () => {
      cache.escribirTenant('test', 'valor')
      expect(cache.eliminarTenant('test')).toBe(true)
      expect(cache.existeTenant('test')).toBe(false)
    })

    it('eliminarTenant retorna false si la clave no existía', () => {
      expect(cache.eliminarTenant('inexistente')).toBe(false)
    })
  })

  describe('Aislamiento multi-tenant (CRÍTICO)', () => {
    it('clínica A y clínica B no comparten datos', () => {
      mockClinicaId = 'clinica-A'
      cache.escribirTenant('pacientes', [{ id: 1, nombre: 'Paciente A' }])

      mockClinicaId = 'clinica-B'
      expect(cache.leerTenant('pacientes')).toBeNull()

      cache.escribirTenant('pacientes', [{ id: 2, nombre: 'Paciente B' }])

      mockClinicaId = 'clinica-A'
      expect(cache.leerTenant('pacientes')).toEqual([{ id: 1, nombre: 'Paciente A' }])

      mockClinicaId = 'clinica-B'
      expect(cache.leerTenant('pacientes')).toEqual([{ id: 2, nombre: 'Paciente B' }])
    })

    it('[] de Supabase en clínica B NO recupera cache de clínica A', () => {
      mockClinicaId = 'clinica-A'
      const datosA = Array.from({ length: 50 }, (_, i) => ({ id: i, nombre: `A-${i}` }))
      cache.escribirTenant('pacientes', datosA)

      mockClinicaId = 'clinica-B'
      expect(cache.leerTenant('pacientes', [])).toEqual([])
      expect(cache.leerTenant('pacientes', [])).not.toEqual(datosA)
    })

    it('cambio de clínica no deja residuos visibles', () => {
      mockClinicaId = 'clinica-A'
      cache.escribirTenant('citas', [{ id: 1 }])
      cache.escribirTenant('pagos', [{ id: 2 }])

      mockClinicaId = 'clinica-B'
      expect(cache.existeTenant('citas')).toBe(false)
      expect(cache.existeTenant('pagos')).toBe(false)
      expect(cache.leerTenant('citas')).toBeNull()
      expect(cache.leerTenant('pagos')).toBeNull()
    })
  })

  describe('invalidarClinica', () => {
    it('elimina SOLO las claves de la clínica especificada', () => {
      mockClinicaId = 'clinica-A'
      cache.escribirTenant('citas', [1])
      cache.escribirTenant('pagos', [2])

      mockClinicaId = 'clinica-B'
      cache.escribirTenant('citas', [3])

      const eliminadas = cache.invalidarClinica('clinica-A')

      expect(eliminadas).toBe(2)
      mockClinicaId = 'clinica-A'
      expect(cache.existeTenant('citas')).toBe(false)
      expect(cache.existeTenant('pagos')).toBe(false)
      mockClinicaId = 'clinica-B'
      expect(cache.leerTenant('citas')).toEqual([3])
    })

    it('no toca claves no-tenant (legacy)', () => {
      localStorage.setItem('studio_dental_legacy', 'valor')
      mockClinicaId = 'clinica-A'
      cache.escribirTenant('citas', [1])

      cache.invalidarClinica('clinica-A')

      expect(localStorage.getItem('studio_dental_legacy')).toBe('valor')
    })
  })

  describe('invalidarTodas', () => {
    it('elimina todas las claves tenant de todas las clínicas', () => {
      mockClinicaId = 'clinica-A'
      cache.escribirTenant('citas', [1])
      mockClinicaId = 'clinica-B'
      cache.escribirTenant('citas', [2])
      mockClinicaId = 'clinica-C'
      cache.escribirTenant('pagos', [3])

      const eliminadas = cache.invalidarTodas()

      expect(eliminadas).toBe(3)
      mockClinicaId = 'clinica-A'
      expect(cache.existeTenant('citas')).toBe(false)
      mockClinicaId = 'clinica-B'
      expect(cache.existeTenant('citas')).toBe(false)
      mockClinicaId = 'clinica-C'
      expect(cache.existeTenant('pagos')).toBe(false)
    })

    it('no toca claves no-tenant', () => {
      localStorage.setItem('studio_dental_legacy', 'valor')
      localStorage.setItem('darkMode', 'true')
      mockClinicaId = 'clinica-A'
      cache.escribirTenant('citas', [1])

      cache.invalidarTodas()

      expect(localStorage.getItem('studio_dental_legacy')).toBe('valor')
      expect(localStorage.getItem('darkMode')).toBe('true')
    })
  })

  describe('listarClavesTenant', () => {
    it('retorna solo las claves con prefijo sd_', () => {
      mockClinicaId = 'clinica-A'
      cache.escribirTenant('citas', [1])
      cache.escribirTenant('pagos', [2])
      localStorage.setItem('studio_dental_legacy', 'no tenant')
      localStorage.setItem('darkMode', 'no tenant')

      const claves = cache.listarClavesTenant()

      expect(claves).toHaveLength(2)
      expect(claves.every((k) => k.startsWith('sd_'))).toBe(true)
    })
  })

  describe('Escenarios de fallo', () => {
    it('escribirTenant retorna false si localStorage falla (cuota excedida)', () => {
      const failStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(() => { throw new Error('QuotaExceededError') }),
        removeItem: vi.fn(),
      }
      vi.stubGlobal('localStorage', failStorage)

      expect(cache.escribirTenant('test', 'valor')).toBe(false)
    })

    it('leerTenant retorna fallback si localStorage falla', () => {
      const failStorage = {
        getItem: vi.fn(() => { throw new Error('SecurityError') }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }
      vi.stubGlobal('localStorage', failStorage)

      expect(cache.leerTenant('test', 'fallback')).toBe('fallback')
    })
  })
})
