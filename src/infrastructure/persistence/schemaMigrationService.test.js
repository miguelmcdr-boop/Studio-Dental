/**
 * Tests del servicio de migración de esquemas (F3-06 — MASTER_ROADMAP).
 *
 * Cubre:
 * - Envoltura y desenvoltura de datos versionados
 * - Backward compatibility (datos sin versión tratados como v1)
 * - Migraciones secuenciales v1 → v2 → v3
 * - Manejo de versión futura (downgrade)
 * - Manejo de errores en migraciones
 */

import { describe, it, expect, vi } from 'vitest'
import {
  wrapWithVersion,
  isVersionedData,
  unwrapAndMigrate
} from './schemaMigrationService'

describe('schemaMigrationService (F3-06)', () => {
  describe('wrapWithVersion', () => {
    it('envuelve datos con número de versión', () => {
      const data = [{ id: 1, nombre: 'Test' }]
      const wrapped = wrapWithVersion(data, 1)
      expect(wrapped).toEqual({ schemaVersion: 1, data })
    })

    it('funciona con cualquier tipo de dato', () => {
      expect(wrapWithVersion({ a: 1 }, 2)).toEqual({
        schemaVersion: 2,
        data: { a: 1 }
      })
      expect(wrapWithVersion('string', 3)).toEqual({
        schemaVersion: 3,
        data: 'string'
      })
      expect(wrapWithVersion(null, 1)).toEqual({ schemaVersion: 1, data: null })
      expect(wrapWithVersion([], 1)).toEqual({ schemaVersion: 1, data: [] })
    })
  })

  describe('isVersionedData', () => {
    it('retorna true para datos correctamente versionados', () => {
      expect(isVersionedData({ schemaVersion: 1, data: [] })).toBe(true)
      expect(isVersionedData({ schemaVersion: 5, data: { x: 1 } })).toBe(true)
    })

    it('retorna false para datos sin versión', () => {
      expect(isVersionedData([])).toBe(false)
      expect(isVersionedData({})).toBe(false)
      expect(isVersionedData({ data: [] })).toBe(false)
      expect(isVersionedData({ schemaVersion: 'no-numero', data: [] })).toBe(false)
      expect(isVersionedData({ schemaVersion: 0, data: [] })).toBe(false)
      expect(isVersionedData({ schemaVersion: -1, data: [] })).toBe(false)
      expect(isVersionedData({ schemaVersion: 1.5, data: [] })).toBe(false)
    })

    it('retorna false para valores primitivos', () => {
      expect(isVersionedData(null)).toBe(false)
      expect(isVersionedData(undefined)).toBe(false)
      expect(isVersionedData('string')).toBe(false)
      expect(isVersionedData(123)).toBe(false)
      expect(isVersionedData(true)).toBe(false)
    })

    it('retorna false para arrays (aunque tengan objetos dentro)', () => {
      expect(isVersionedData([{ schemaVersion: 1, data: [] }])).toBe(false)
    })
  })

  describe('unwrapAndMigrate', () => {
    const mockMigrations = {
      2: (data) => data.map((item) => ({ ...item, notas: item.notas ?? '' })),
      3: (data) =>
        data.map((item) => ({ ...item, timestamp: item.timestamp ?? Date.now() }))
    }

    describe('backward compatibility (datos sin versión)', () => {
      it('trata datos sin versión como v1 y aplica migraciones', () => {
        const dataSinVersion = [{ id: 1, nombre: 'Test' }]
        const result = unwrapAndMigrate(dataSinVersion, 2, mockMigrations, [])
        expect(result).toEqual([{ id: 1, nombre: 'Test', notas: '' }])
      })

      it('retorna datos tal cual si versión actual es 1', () => {
        const dataSinVersion = [{ id: 1 }]
        const result = unwrapAndMigrate(dataSinVersion, 1, {}, [])
        expect(result).toEqual([{ id: 1 }])
      })
    })

    describe('versión actual', () => {
      it('retorna datos tal cual si la versión es la actual', () => {
        const wrapped = { schemaVersion: 2, data: [{ id: 1, notas: 'algo' }] }
        const result = unwrapAndMigrate(wrapped, 2, mockMigrations, [])
        expect(result).toEqual([{ id: 1, notas: 'algo' }])
      })
    })

    describe('migración hacia adelante (up-migration)', () => {
      it('aplica migración v1 → v2', () => {
        const wrapped = { schemaVersion: 1, data: [{ id: 1, nombre: 'Test' }] }
        const result = unwrapAndMigrate(wrapped, 2, mockMigrations, [])
        expect(result).toEqual([{ id: 1, nombre: 'Test', notas: '' }])
      })

      it('aplica migraciones secuenciales v1 → v2 → v3', () => {
        const wrapped = { schemaVersion: 1, data: [{ id: 1, nombre: 'Test' }] }
        const result = unwrapAndMigrate(wrapped, 3, mockMigrations, [])
        expect(result[0].notas).toBe('')
        expect(result[0].timestamp).toBeDefined()
        expect(typeof result[0].timestamp).toBe('number')
      })

      it('preserva datos existentes durante la migración', () => {
        const wrapped = {
          schemaVersion: 1,
          data: [{ id: 1, nombre: 'Ana', notas: 'notas existentes' }]
        }
        const result = unwrapAndMigrate(wrapped, 2, mockMigrations, [])
        expect(result[0].notas).toBe('notas existentes') // no se sobreescribe
      })
    })

    describe('versión futura (downgrade)', () => {
      it('retorna datos tal cual con warning si versión > actual', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const wrapped = { schemaVersion: 5, data: [{ id: 1, campoFuturo: true }] }
        const result = unwrapAndMigrate(wrapped, 2, mockMigrations, [])
        expect(result).toEqual([{ id: 1, campoFuturo: true }])
        expect(warnSpy).toHaveBeenCalled()
        warnSpy.mockRestore()
      })
    })

    describe('manejo de errores', () => {
      it('retorna datos originales si una migración falla', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const failingMigrations = {
          2: () => {
            throw new Error('Migración fallida')
          }
        }
        const wrapped = { schemaVersion: 1, data: [{ id: 1 }] }
        const result = unwrapAndMigrate(wrapped, 2, failingMigrations, [])
        expect(result).toEqual([{ id: 1 }])
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
      })

      it('detiene migración si no hay función para la siguiente versión', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const partialMigrations = {
          2: (data) => data.map((d) => ({ ...d, nuevo: true }))
        }
        const wrapped = { schemaVersion: 1, data: [{ id: 1 }] }
        const result = unwrapAndMigrate(wrapped, 3, partialMigrations, [])
        // Aplica v2 pero se detiene antes de v3
        expect(result[0].nuevo).toBe(true)
        expect(warnSpy).toHaveBeenCalled()
        warnSpy.mockRestore()
      })
    })

    describe('valores null/undefined', () => {
      it('usa fallback para datos null', () => {
        const result = unwrapAndMigrate(null, 1, {}, ['fallback'])
        expect(result).toEqual(['fallback'])
      })

      it('usa fallback para datos undefined', () => {
        const result = unwrapAndMigrate(undefined, 1, {}, ['fallback'])
        expect(result).toEqual(['fallback'])
      })
    })
  })
})