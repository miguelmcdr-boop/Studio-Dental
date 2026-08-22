/**
 * Tests — pacientesSoftDeleteService (F6-F)
 *
 * Valida soft delete, restauración y papelera de reciclaje.
 * Usa mocks de supabaseClient (mismo patrón que datosClinicosSupabase.integration.test.js).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  eliminarPaciente,
  restaurarPaciente,
  listarPacientesEliminados
} from './pacientesSoftDeleteService'

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn()
}))

vi.mock('../../../services/supabaseClient', () => ({
  supabase: {
    from: mockFrom
  },
  USE_SUPABASE: true
}))

vi.mock('./pacientesTransformations', () => ({
  transformarDesdeSupabase: (row) => {
    if (!row) return null
    const { created_at, updated_at, ...rest } = row
    return { ...rest, createdAt: created_at, updatedAt: updated_at }
  },
  transformarParaSupabase: (obj) => obj
}))

/**
 * Mock awaitable que soporta encadenamiento + await
 * (mismo patrón validado en F6-D-7).
 */
const crearAwaitableMock = (result) => {
  const awaitable = {
    select: vi.fn(),
    eq: vi.fn(),
    update: vi.fn(),
    is: vi.fn(),
    not: vi.fn(),
    order: vi.fn(),
    then: vi.fn((resolve) => Promise.resolve(result).then(resolve))
  }
  awaitable.select.mockReturnValue(awaitable)
  awaitable.eq.mockReturnValue(awaitable)
  awaitable.update.mockReturnValue(awaitable)
  awaitable.is.mockReturnValue(awaitable)
  awaitable.not.mockReturnValue(awaitable)
  awaitable.order.mockResolvedValue(result)
  return awaitable
}

describe('pacientesSoftDeleteService (F6-F)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('eliminarPaciente (soft delete)', () => {
    it('marca deleted_at en lugar de borrar', async () => {
      const pacienteId = 'paciente-uuid-123'
      mockFrom.mockReturnValue(crearAwaitableMock({ data: null, error: null }))

      const resultado = await eliminarPaciente(pacienteId)

      expect(resultado).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('pacientes')

      const chain = mockFrom()
      expect(chain.update).toHaveBeenCalled()
      expect(chain.eq).toHaveBeenCalled()
    })

    it('retorna false si pacienteId es vacío', async () => {
      expect(await eliminarPaciente('')).toBe(false)
      expect(await eliminarPaciente(null)).toBe(false)
      expect(await eliminarPaciente(undefined)).toBe(false)
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('retorna false si Supabase retorna error', async () => {
      mockFrom.mockReturnValue(crearAwaitableMock({
        data: null,
        error: { message: 'RLS: permission denied' }
      }))

      const resultado = await eliminarPaciente('paciente-uuid-456')
      expect(resultado).toBe(false)
    })

    it('solo afecta pacientes activos (deleted_at IS NULL)', async () => {
      mockFrom.mockReturnValue(crearAwaitableMock({ data: null, error: null }))

      await eliminarPaciente('paciente-uuid-789')

      // Verificar que se llamó a .is('deleted_at', null)
      const chain = mockFrom()
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
    })
  })

  describe('restaurarPaciente', () => {
    it('quita marca deleted_at correctamente', async () => {
      const pacienteId = 'paciente-uuid-restore'
      mockFrom.mockReturnValue(crearAwaitableMock({ data: null, error: null }))

      const resultado = await restaurarPaciente(pacienteId)

      expect(resultado).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('pacientes')
    })

    it('retorna false si pacienteId es vacío', async () => {
      expect(await restaurarPaciente('')).toBe(false)
      expect(await restaurarPaciente(null)).toBe(false)
    })

    it('retorna false si Supabase retorna error', async () => {
      mockFrom.mockReturnValue(crearAwaitableMock({
        data: null,
        error: { message: 'Not found' }
      }))

      const resultado = await restaurarPaciente('paciente-inexistente')
      expect(resultado).toBe(false)
    })

    it('solo restaura pacientes eliminados (deleted_at IS NOT NULL)', async () => {
      mockFrom.mockReturnValue(crearAwaitableMock({ data: null, error: null }))

      await restaurarPaciente('paciente-uuid-active')

      const chain = mockFrom()
      expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null)
    })
  })

  describe('listarPacientesEliminados (papelera)', () => {
    it('retorna pacientes con deleted_at no null', async () => {
      const pacientesEliminados = [
        { id: 'pac-1', nombre: 'Juan Pérez', deleted_at: '2026-08-20T10:00:00Z' },
        { id: 'pac-2', nombre: 'María López', deleted_at: '2026-08-19T15:00:00Z' }
      ]
      mockFrom.mockReturnValue(crearAwaitableMock({ data: pacientesEliminados, error: null }))

      const resultado = await listarPacientesEliminados()

      expect(resultado).toHaveLength(2)
      expect(resultado[0].nombre).toBe('Juan Pérez')
      expect(resultado[1].nombre).toBe('María López')
    })

    it('retorna array vacío si no hay eliminados', async () => {
      mockFrom.mockReturnValue(crearAwaitableMock({ data: [], error: null }))

      const resultado = await listarPacientesEliminados()
      expect(resultado).toEqual([])
    })

    it('retorna array vacío si Supabase falla', async () => {
      mockFrom.mockReturnValue(crearAwaitableMock({
        data: null,
        error: { message: 'Network error' }
      }))

      const resultado = await listarPacientesEliminados()
      expect(resultado).toEqual([])
    })

    it('ordena por fecha de eliminación descendente', async () => {
      mockFrom.mockReturnValue(crearAwaitableMock({ data: [], error: null }))

      await listarPacientesEliminados()

      const chain = mockFrom()
      expect(chain.order).toHaveBeenCalledWith('deleted_at', { ascending: false })
    })
  })

  describe('Integración: ciclo de vida completo', () => {
    it('eliminar → listar → restaurar funciona como flujo completo', async () => {
      const pacienteId = 'paciente-ciclo-vida'

      // Paso 1: eliminar
      mockFrom.mockReturnValue(crearAwaitableMock({ data: null, error: null }))
      const eliminado = await eliminarPaciente(pacienteId)
      expect(eliminado).toBe(true)

      // Paso 2: listar papelera
      mockFrom.mockReturnValue(crearAwaitableMock({
        data: [{ id: pacienteId, nombre: 'Test', deleted_at: '2026-08-22T10:00:00Z' }],
        error: null
      }))
      const papelera = await listarPacientesEliminados()
      expect(papelera).toHaveLength(1)
      expect(papelera[0].id).toBe(pacienteId)

      // Paso 3: restaurar
      mockFrom.mockReturnValue(crearAwaitableMock({ data: null, error: null }))
      const restaurado = await restaurarPaciente(pacienteId)
      expect(restaurado).toBe(true)
    })
  })
})
