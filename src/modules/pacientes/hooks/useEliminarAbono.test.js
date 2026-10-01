import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockConfirm } = vi.hoisted(() => ({
  mockConfirm: vi.fn(() => Promise.resolve(true))
}))

vi.mock('../services/pacientesStorageService', () => ({
  pacientesStorageService: { guardarItem: vi.fn() }
}))

vi.mock('../../pagos/services/pagosStorageService', () => ({
  pagosStorageService: {
    obtenerPagos: vi.fn(() => []),
    guardarPagos: vi.fn()
  }
}))

vi.mock('../../../hooks/useAppDialog', () => ({
  useAppDialog: () => ({ confirm: mockConfirm })
}))

import { useEliminarAbono } from './useEliminarAbono'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { pagosStorageService } from '../../pagos/services/pagosStorageService'

describe('useEliminarAbono (Commit D)', () => {
  const paciente = { id: 42, nombre: 'Ana' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockResolvedValue(true)
  })

  describe('sin pago global asociado', () => {
    it('muestra confirm genérico y borra solo el abono', async () => {
      const abonos = [{ id: 1, monto: 50000 }]
      const setAbonos = vi.fn()
      pagosStorageService.obtenerPagos.mockReturnValue([])

      const { result } = renderHook(() =>
        useEliminarAbono({ abonos, setAbonos, paciente })
      )

      await act(async () => {
        await result.current.handleEliminarAbono(1)
      })

      expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({
        description: '¿Deseas eliminar este registro de abono ingresado?'
      }))
      expect(pagosStorageService.guardarPagos).not.toHaveBeenCalled()
      expect(setAbonos).toHaveBeenCalledWith([])
      expect(pacientesStorageService.guardarItem).toHaveBeenCalledWith('abonos_42', [])
    })
  })

  describe('con pago global asociado (sincronizado)', () => {
    it('muestra confirm específico y anula el pago global', async () => {
      const abonos = [{ id: 100, monto: 50000 }]
      const setAbonos = vi.fn()
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 100, pacienteId: 42, folioComprobante: 'REC-001', estado: 'Emitido', monto: 50000 }
      ])

      const { result } = renderHook(() =>
        useEliminarAbono({ abonos, setAbonos, paciente })
      )

      await act(async () => {
        await result.current.handleEliminarAbono(100)
      })

      expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({
        description: expect.stringContaining('REC-001')
      }))
      expect(pagosStorageService.guardarPagos).toHaveBeenCalled()
      const pagosGuardados = pagosStorageService.guardarPagos.mock.calls[0][0]
      expect(pagosGuardados[0].estado).toBe('Anulado')
      expect(pagosGuardados[0].motivoAnulacion).toBe('Abono eliminado desde Plan de Tratamiento')
    })

    it('no anula pago de OTRO paciente aunque coincida el id', async () => {
      const abonos = [{ id: 100, monto: 50000 }]
      const setAbonos = vi.fn()
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 100, pacienteId: 99, folioComprobante: 'REC-002', estado: 'Emitido', monto: 50000 }
      ])

      const { result } = renderHook(() =>
        useEliminarAbono({ abonos, setAbonos, paciente })
      )

      await act(async () => {
        await result.current.handleEliminarAbono(100)
      })

      expect(pagosStorageService.guardarPagos).not.toHaveBeenCalled()
    })

    it('no anula pago que ya estaba anulado', async () => {
      const abonos = [{ id: 100, monto: 50000 }]
      const setAbonos = vi.fn()
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 100, pacienteId: 42, folioComprobante: 'REC-003', estado: 'Anulado', monto: 50000 }
      ])

      const { result } = renderHook(() =>
        useEliminarAbono({ abonos, setAbonos, paciente })
      )

      await act(async () => {
        await result.current.handleEliminarAbono(100)
      })

      expect(pagosStorageService.guardarPagos).not.toHaveBeenCalled()
    })

    it('si usuario cancela, no borra nada', async () => {
      mockConfirm.mockResolvedValueOnce(false)
      const abonos = [{ id: 100, monto: 50000 }]
      const setAbonos = vi.fn()
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 100, pacienteId: 42, estado: 'Emitido', folioComprobante: 'REC-004' }
      ])

      const { result } = renderHook(() =>
        useEliminarAbono({ abonos, setAbonos, paciente })
      )

      await act(async () => {
        await result.current.handleEliminarAbono(100)
      })

      expect(setAbonos).not.toHaveBeenCalled()
      expect(pagosStorageService.guardarPagos).not.toHaveBeenCalled()
    })
  })
})
