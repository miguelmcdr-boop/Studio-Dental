/**
 * Tests de createTenantRepository — F7-36 FASE 1 (Commit 1.4)
 *
 * Cubre el wrapper multi-tenant sobre tenantCache con la misma API
 * que createLocalStorageRepository. Verifica:
 *   - Fail-safe real sin clínica activa (nunca rompe la app)
 *   - Funcionalidad con clínica activa
 *   - Aislamiento multi-tenant estricto
 *   - Eventos (notify + custom) — NO se disparan sin clínica
 *   - Versionado de esquemas (F3-06)
 *   - Los 4 métodos: obtener, guardar, eliminar, existe
 *
 * Estrategia de mock: tenantCache se mockea con estado mutable para
 * controlar si hay clínica activa en cada test.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Estado mutable que controla el mock de tenantCache
let mockClinicaId = null

// Mock de tenantCache que simula el comportamiento real pero es controlable
vi.mock('../tenant/tenantCache', () => ({
  tenantCache: {
    claveTenant: (baseKey) => {
      if (!mockClinicaId) throw new Error('tenantCache: no hay clínica activa')
      return `sd_${mockClinicaId}_${baseKey}`
    },
    leerTenant: (baseKey, fallback) => {
      if (!mockClinicaId) throw new Error('tenantCache: no hay clínica activa')
      const key = `sd_${mockClinicaId}_${baseKey}`
      const saved = localStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : fallback
    },
    escribirTenant: (baseKey, value) => {
      if (!mockClinicaId) throw new Error('tenantCache: no hay clínica activa')
      const key = `sd_${mockClinicaId}_${baseKey}`
      localStorage.setItem(key, JSON.stringify(value))
      return true
    },
    eliminarTenant: (baseKey) => {
      if (!mockClinicaId) throw new Error('tenantCache: no hay clínica activa')
      const key = `sd_${mockClinicaId}_${baseKey}`
      const existia = localStorage.getItem(key) !== null
      localStorage.removeItem(key)
      return existia
    },
    existeTenant: (baseKey) => {
      if (!mockClinicaId) throw new Error('tenantCache: no hay clínica activa')
      return localStorage.getItem(`sd_${mockClinicaId}_${baseKey}`) !== null
    },
  },
}))

// Importar después de mockear
import { createTenantRepository } from './localStorageRepository'

describe('createTenantRepository', () => {
  beforeEach(() => {
    mockClinicaId = null // Sin clínica activa por defecto
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('API pública', () => {
    it('expone los 4 métodos y baseKey', () => {
      const repo = createTenantRepository('test_key', [])
      expect(repo.baseKey).toBe('test_key')
      expect(typeof repo.obtener).toBe('function')
      expect(typeof repo.guardar).toBe('function')
      expect(typeof repo.eliminar).toBe('function')
      expect(typeof repo.existe).toBe('function')
    })
  })

  describe('Fail-safe sin clínica activa (crítico)', () => {
    it('obtener() retorna defaultValue sin lanzar error', () => {
      const repo = createTenantRepository('test_key', ['default'])
      expect(() => repo.obtener()).not.toThrow()
      expect(repo.obtener()).toEqual(['default'])
    })

    it('obtener() retorna fallback pasado explícitamente', () => {
      const repo = createTenantRepository('test_key', ['default'])
      expect(repo.obtener(['explicit_fallback'])).toEqual(['explicit_fallback'])
    })

    it('guardar() retorna false sin lanzar error', () => {
      const repo = createTenantRepository('test_key', [])
      expect(() => repo.guardar([1, 2, 3])).not.toThrow()
      expect(repo.guardar([1, 2, 3])).toBe(false)
    })

    it('eliminar() retorna false sin lanzar error', () => {
      const repo = createTenantRepository('test_key', [])
      expect(() => repo.eliminar()).not.toThrow()
      expect(repo.eliminar()).toBe(false)
    })

    it('existe() retorna false sin lanzar error', () => {
      const repo = createTenantRepository('test_key', [])
      expect(() => repo.existe()).not.toThrow()
      expect(repo.existe()).toBe(false)
    })

    it('guardar() sin clínica NO dispara eventos (evita eventos fantasma)', () => {
      const storageEventSpy = vi.fn()
      const customEventSpy = vi.fn()
      window.addEventListener('storage', storageEventSpy)
      window.addEventListener('custom_event', customEventSpy)

      const repo = createTenantRepository('test_key', [], {
        notify: true,
        eventos: ['custom_event'],
      })
      repo.guardar([1, 2, 3])

      expect(storageEventSpy).not.toHaveBeenCalled()
      expect(customEventSpy).not.toHaveBeenCalled()

      window.removeEventListener('storage', storageEventSpy)
      window.removeEventListener('custom_event', customEventSpy)
    })
  })

  describe('Funcionalidad con clínica activa', () => {
    beforeEach(() => {
      mockClinicaId = 'clinica-A'
    })

    it('obtener() retorna defaultValue si no hay datos', () => {
      const repo = createTenantRepository('test_key', ['default'])
      expect(repo.obtener()).toEqual(['default'])
    })

    it('guardar() + obtener() round-trip funciona', () => {
      const repo = createTenantRepository('test_key', [])
      const datos = [{ id: 1, nombre: 'Test' }]

      expect(repo.guardar(datos)).toBe(true)
      expect(repo.obtener()).toEqual(datos)
    })

    it('existe() retorna true si hay datos', () => {
      const repo = createTenantRepository('test_key', [])
      expect(repo.existe()).toBe(false)

      repo.guardar([1])
      expect(repo.existe()).toBe(true)
    })

    it('eliminar() elimina los datos', () => {
      const repo = createTenantRepository('test_key', [])
      repo.guardar([1])
      expect(repo.existe()).toBe(true)

      expect(repo.eliminar()).toBe(true)
      expect(repo.existe()).toBe(false)
      expect(repo.obtener()).toEqual([])
    })

    it('guardar() escribe con formato sd_<clinicaId>_<baseKey>', () => {
      const repo = createTenantRepository('test_key', [])
      repo.guardar({ a: 1 })

      expect(localStorage.getItem('sd_clinica-A_test_key')).toBe(JSON.stringify({ a: 1 }))
    })
  })

  describe('Aislamiento multi-tenant (crítico)', () => {
    it('Clínica A no ve datos de Clínica B', () => {
      // Clínica A guarda datos
      mockClinicaId = 'clinica-A'
      const repoA = createTenantRepository('pacientes', [])
      repoA.guardar([{ id: 'A-1', nombre: 'Paciente A' }])

      // Clínica B no ve los datos de A
      mockClinicaId = 'clinica-B'
      const repoB = createTenantRepository('pacientes', [])
      expect(repoB.obtener()).toEqual([])
      expect(repoB.existe()).toBe(false)

      // Clínica B guarda sus propios datos
      repoB.guardar([{ id: 'B-1', nombre: 'Paciente B' }])

      // Clínica A sigue viendo solo sus datos
      mockClinicaId = 'clinica-A'
      expect(repoA.obtener()).toEqual([{ id: 'A-1', nombre: 'Paciente A' }])

      // Clínica B ve solo sus datos
      mockClinicaId = 'clinica-B'
      expect(repoB.obtener()).toEqual([{ id: 'B-1', nombre: 'Paciente B' }])
    })

    it('Cambio A → B → A mantiene datos separados', () => {
      const repo = createTenantRepository('citas', [])

      // Clínica A
      mockClinicaId = 'clinica-A'
      repo.guardar([{ id: 'cita-A' }])

      // Cambio a B (debe ver vacío)
      mockClinicaId = 'clinica-B'
      expect(repo.obtener()).toEqual([])

      // Volver a A (debe ver sus datos)
      mockClinicaId = 'clinica-A'
      expect(repo.obtener()).toEqual([{ id: 'cita-A' }])
    })

    it('eliminar() de una clínica no afecta a la otra', () => {
      const repo = createTenantRepository('datos', [])

      mockClinicaId = 'clinica-A'
      repo.guardar([1])

      mockClinicaId = 'clinica-B'
      repo.guardar([2])

      // Eliminar datos de B
      mockClinicaId = 'clinica-B'
      repo.eliminar()

      // A sigue teniendo sus datos
      mockClinicaId = 'clinica-A'
      expect(repo.obtener()).toEqual([1])
    })
  })

  describe('Eventos con clínica activa', () => {
    beforeEach(() => {
      mockClinicaId = 'clinica-A'
    })

    it('notify: true dispara evento storage', () => {
      const storageEventSpy = vi.fn()
      window.addEventListener('storage', storageEventSpy)

      const repo = createTenantRepository('test_key', [], { notify: true })
      repo.guardar([1])

      expect(storageEventSpy).toHaveBeenCalled()

      window.removeEventListener('storage', storageEventSpy)
    })

    it('eventos: [name] dispara CustomEvents', () => {
      const customEventSpy = vi.fn()
      window.addEventListener('arancel_actualizado', customEventSpy)

      const repo = createTenantRepository('test_key', [], {
        eventos: ['arancel_actualizado'],
      })
      repo.guardar([1])

      expect(customEventSpy).toHaveBeenCalled()

      window.removeEventListener('arancel_actualizado', customEventSpy)
    })
  })

  describe('Versionado de esquemas (F3-06)', () => {
    beforeEach(() => {
      mockClinicaId = 'clinica-A'
    })

    it('schemaVersion envuelve datos al guardar', () => {
      const repo = createTenantRepository('test_key', [], { schemaVersion: 2 })
      repo.guardar({ nombre: 'Test' })

      const stored = JSON.parse(localStorage.getItem('sd_clinica-A_test_key'))
      expect(stored).toHaveProperty('schemaVersion', 2)
      expect(stored).toHaveProperty('data')
      expect(stored.data).toEqual({ nombre: 'Test' })
    })

    it('obtener() desenvuelve datos versionados', () => {
      const repo = createTenantRepository('test_key', [], { schemaVersion: 2 })
      repo.guardar({ nombre: 'Test' })

      const result = repo.obtener()
      expect(result).toEqual({ nombre: 'Test' })
    })
  })
})
