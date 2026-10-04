/**
 * Tests unitarios de conflictDetectionService (F5-04).
 *
 * Cobertura:
 * - detectarConflicto retorna hayConflicto: false si remoto es igual o anterior
 * - detectarConflicto retorna hayConflicto: true si remoto es más reciente
 * - detectarConflicto maneja errores de red gracefully
 * - detectarConflicto retorna hayConflicto: false si Supabase no configurado
 * - registrarAuditoria hace INSERT en audit_log
 * - registrarAuditoria maneja errores sin romper flujo
 * - resolverConflicto aplica manual_local correctamente
 * - resolverConflicto aplica manual_remote correctamente
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de supabaseClient
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  },
  USE_SUPABASE: true
}))

describe('conflictDetectionService', () => {
  let conflictDetectionService
  let mockFrom
  let mockGetUser

  beforeEach(async () => {
    vi.clearAllMocks()

    mockFrom = vi.fn()
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null
    })

    const { supabase } = await import('./supabaseClient')
    supabase.from = mockFrom
    supabase.auth.getUser = mockGetUser

    vi.resetModules()
    const module = await import('./conflictDetectionService')
    conflictDetectionService = module.conflictDetectionService
  })

  describe('detectarConflicto', () => {
    it('debe retornar hayConflicto: false si remoto es igual a local', async () => {
      const fechaComun = '2026-08-14T10:00:00.000Z'

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'p1', nombre: 'Test', updated_at: fechaComun },
          error: null
        })
      })

      const result = await conflictDetectionService.detectarConflicto(
        'pacientes',
        'p1',
        fechaComun
      )

      expect(result.hayConflicto).toBe(false)
      expect(result.versionRemota).not.toBeNull()
    })

    it('debe retornar hayConflicto: false si remoto es anterior a local', async () => {
      const local = '2026-08-14T11:00:00.000Z' // más reciente
      const remoto = '2026-08-14T10:00:00.000Z' // más antiguo

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'p1', updated_at: remoto },
          error: null
        })
      })

      const result = await conflictDetectionService.detectarConflicto(
        'pacientes',
        'p1',
        local
      )

      expect(result.hayConflicto).toBe(false)
    })

    it('debe retornar hayConflicto: true si remoto es más reciente que local', async () => {
      const local = '2026-08-14T10:00:00.000Z' // más antiguo
      const remoto = '2026-08-14T12:00:00.000Z' // mucho más reciente (2h después)

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'p1', nombre: 'Remoto', updated_at: remoto },
          error: null
        })
      })

      const result = await conflictDetectionService.detectarConflicto(
        'pacientes',
        'p1',
        local
      )

      expect(result.hayConflicto).toBe(true)
      expect(result.versionRemota).not.toBeNull()
      expect(result.versionRemota.nombre).toBe('Remoto')
      expect(result.updatedAtRemoto).toBe(remoto)
    })

    it('debe tolerar diferencias pequeñas (≤1s) para evitar falsos positivos', async () => {
      const base = new Date('2026-08-14T10:00:00.000Z').getTime()
      const local = new Date(base).toISOString()
      const remoto = new Date(base + 500).toISOString() // 500ms después

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'p1', updated_at: remoto },
          error: null
        })
      })

      const result = await conflictDetectionService.detectarConflicto(
        'pacientes',
        'p1',
        local
      )

      expect(result.hayConflicto).toBe(false)
    })

    it('debe retornar hayConflicto: false si el registro no existe remotamente', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const result = await conflictDetectionService.detectarConflicto(
        'pacientes',
        'p1',
        '2026-08-14T10:00:00.000Z'
      )

      expect(result.hayConflicto).toBe(false)
      expect(result.versionRemota).toBeNull()
    })

    it('debe manejar errores de red gracefully', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' }
        })
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await conflictDetectionService.detectarConflicto(
        'pacientes',
        'p1',
        '2026-08-14T10:00:00.000Z'
      )

      expect(result.hayConflicto).toBe(false)
      consoleErrorSpy.mockRestore()
    })

    it('debe aceptar timestamp numérico como updatedAtLocal', async () => {
      const localMs = Date.now() - 3600000 // hace 1h
      const remotoISO = new Date().toISOString() // ahora

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'p1', updated_at: remotoISO },
          error: null
        })
      })

      const result = await conflictDetectionService.detectarConflicto(
        'pacientes',
        'p1',
        localMs
      )

      expect(result.hayConflicto).toBe(true)
    })
  })

  describe('registrarAuditoria', () => {
    it('debe hacer INSERT en tabla audit_log', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValue({ insert: mockInsert })

      await conflictDetectionService.registrarAuditoria(
        'pacientes',
        'p1',
        'UPDATE',
        { nombre: 'Viejo' },
        { nombre: 'Nuevo' },
        'manual_local'
      )

      expect(mockFrom).toHaveBeenCalledWith('audit_log')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          table_name: 'pacientes',
          record_id: 'p1',
          action: 'UPDATE',
          old_data: { nombre: 'Viejo' },
          new_data: { nombre: 'Nuevo' },
          resolution_strategy: 'manual_local',
          user_email: 'test@test.com'
        })
      )
    })

    it('debe manejar errores sin lanzar excepción', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
      mockFrom.mockReturnValue({ insert: mockInsert })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        conflictDetectionService.registrarAuditoria(
          'pacientes',
          'p1',
          'UPDATE',
          null,
          null,
          null
        )
      ).resolves.not.toThrow()

      consoleErrorSpy.mockRestore()
    })

    it('no debe fallar si no hay usuario autenticado', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await expect(
        conflictDetectionService.registrarAuditoria(
          'pacientes',
          'p1',
          'UPDATE',
          null,
          null,
          null
        )
      ).resolves.not.toThrow()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('resolverConflicto', () => {
    it('debe retornar datos locales si decision es "local"', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValue({ insert: mockInsert })

      const datosLocales = { id: 'p1', nombre: 'Local' }
      const datosRemotos = { id: 'p1', nombre: 'Remoto' }

      const result = await conflictDetectionService.resolverConflicto(
        'pacientes',
        'p1',
        'local',
        datosLocales,
        datosRemotos
      )

      expect(result).toEqual(datosLocales)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          resolution_strategy: 'manual_local',
          old_data: datosLocales,
          new_data: datosRemotos
        })
      )
    })

    it('debe retornar datos remotos si decision es "remote"', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValue({ insert: mockInsert })

      const datosLocales = { id: 'p1', nombre: 'Local' }
      const datosRemotos = { id: 'p1', nombre: 'Remoto' }

      const result = await conflictDetectionService.resolverConflicto(
        'pacientes',
        'p1',
        'remote',
        datosLocales,
        datosRemotos
      )

      expect(result).toEqual(datosRemotos)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          resolution_strategy: 'manual_remote'
        })
      )
    })

    it('debe registrar acción CONFLICT_RESOLVED en auditoría', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValue({ insert: mockInsert })

      await conflictDetectionService.resolverConflicto(
        'pacientes',
        'p1',
        'local',
        {},
        {}
      )

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONFLICT_RESOLVED'
        })
      )
    })
  })
})
