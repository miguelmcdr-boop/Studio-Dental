import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted: mocks estables entre el hook y el test (misma referencia)
const { mockAlert, mockConfirm } = vi.hoisted(() => ({
  mockAlert: vi.fn(() => Promise.resolve()),
  mockConfirm: vi.fn(() => Promise.resolve(true))
}))

vi.mock('../services/pagosStorageService', () => ({
  pagosStorageService: {
    obtenerPagos: vi.fn(() => []),
    guardarPagos: vi.fn(),
    sincronizarAbonoConFichaPaciente: vi.fn(),
    purgarPago: vi.fn(() => true),
    obtenerPagosParaAuditoria: vi.fn(() => []),
    removerAbonoDeFichaPaciente: vi.fn(() => true)
  }
}))

vi.mock('../services/pagosExportService', () => ({
  exportarAuditoriaPagosXLSX: vi.fn(() => Promise.resolve({ ok: true, total: 2, nombreArchivo: 'test.xlsx' }))
}))

vi.mock('../../../hooks/useAppDialog', () => ({
  useAppDialog: () => ({
    confirm: mockConfirm,
    alert: mockAlert
  })
}))

vi.mock('../../../store/sesionStore', () => ({
  useSesionStore: (selector) => selector({
    userProfile: { email: 'admin@test.com', rol: 'admin' }
  })
}))

import { usePagos } from './usePagos'
import { pagosStorageService } from '../services/pagosStorageService'
import { exportarAuditoriaPagosXLSX } from '../services/pagosExportService'

describe('usePagos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pagosStorageService.purgarPago.mockReturnValue(true)
  })

  describe('purgarPago', () => {
    it('purga pago con motivo válido y muestra success', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, folioComprobante: 'REC-001', estado: 'Anulado', monto: 50000 }
      ])
      const { result } = renderHook(() => usePagos())

      let ok
      await act(async () => {
        ok = await result.current.purgarPago(1, 'Error del cajero, pago duplicado')
      })

      expect(ok).toBe(true)
      expect(pagosStorageService.purgarPago).toHaveBeenCalledWith(
        1,
        'Error del cajero, pago duplicado',
        'admin@test.com'
      )
      expect(mockAlert).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }))
    })

    it('rechaza purga con motivo muy corto', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, folioComprobante: 'REC-001', estado: 'Anulado' }
      ])
      const { result } = renderHook(() => usePagos())

      let ok
      await act(async () => {
        ok = await result.current.purgarPago(1, 'corto')
      })

      expect(ok).toBe(false)
      expect(pagosStorageService.purgarPago).not.toHaveBeenCalled()
      expect(mockAlert).toHaveBeenCalledWith(expect.objectContaining({ variant: 'warning' }))
    })

    it('muestra error si el pago no existe en storage', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, folioComprobante: 'REC-001', estado: 'Anulado' }
      ])
      pagosStorageService.purgarPago.mockReturnValue(false)
      const { result } = renderHook(() => usePagos())

      let ok
      await act(async () => {
        ok = await result.current.purgarPago(999, 'Motivo válido para purgar pago')
      })

      expect(ok).toBe(false)
      expect(mockAlert).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }))
    })
  })

  describe('exportarAuditoria', () => {
    it('exporta CSV con todos los pagos (vigentes + anulados)', async () => {
      pagosStorageService.obtenerPagosParaAuditoria.mockReturnValue([
        { id: 1, estado: 'Emitido' },
        { id: 2, estado: 'Anulado' }
      ])
      const { result } = renderHook(() => usePagos())

      await act(async () => {
        await result.current.exportarAuditoria()
      })

      expect(exportarAuditoriaPagosXLSX).toHaveBeenCalledWith([
        { id: 1, estado: 'Emitido' },
        { id: 2, estado: 'Anulado' }
      ])
      expect(mockAlert).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }))
    })

    it('muestra error si la exportación falla', async () => {
      exportarAuditoriaPagosXLSX.mockReturnValueOnce(Promise.resolve({ ok: false, total: 0, nombreArchivo: '' }))
      const { result } = renderHook(() => usePagos())

      await act(async () => {
        await result.current.exportarAuditoria()
      })

      expect(mockAlert).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }))
    })
  })

  describe('propagación a Plan de Tratamiento (Commit C)', () => {
    it('anularPago remueve abono de la ficha del paciente', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, folioComprobante: 'REC-001', estado: 'Emitido', pacienteId: 42, monto: 50000, metodoPago: 'Efectivo', pacienteNombre: 'Test', pacienteRut: '1-1' }
      ])
      const { result } = renderHook(() => usePagos())

      await act(async () => {
        await result.current.anularPago(1, 'Error de caja')
      })

      expect(pagosStorageService.removerAbonoDeFichaPaciente).toHaveBeenCalledWith(42, 1)
    })

    it('purgarPago remueve abono de la ficha del paciente', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, folioComprobante: 'REC-001', estado: 'Anulado', pacienteId: 42, monto: 50000 }
      ])
      const { result } = renderHook(() => usePagos())

      await act(async () => {
        await result.current.purgarPago(1, 'Motivo válido para purgar este pago')
      })

      expect(pagosStorageService.removerAbonoDeFichaPaciente).toHaveBeenCalledWith(42, 1)
    })

    it('anularPago no falla si el pago no tiene pacienteId', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, folioComprobante: 'REC-001', estado: 'Emitido', monto: 50000, metodoPago: 'Efectivo', pacienteNombre: 'Test', pacienteRut: '1-1' }
      ])
      const { result } = renderHook(() => usePagos())

      await act(async () => {
        await result.current.anularPago(1, 'Error de caja')
      })

      expect(pagosStorageService.removerAbonoDeFichaPaciente).not.toHaveBeenCalled()
    })
  })

  describe('todosLosPagos', () => {
    it('expone todosLosPagos sin filtrar', () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, estado: 'Emitido', metodoPago: 'Efectivo', folioComprobante: 'R1', pacienteNombre: 'A', pacienteRut: '1-1' },
        { id: 2, estado: 'Anulado', metodoPago: 'Efectivo', folioComprobante: 'R2', pacienteNombre: 'B', pacienteRut: '2-2' }
      ])
      const { result } = renderHook(() => usePagos())
      expect(result.current.todosLosPagos).toHaveLength(2)
    })
  })
})
