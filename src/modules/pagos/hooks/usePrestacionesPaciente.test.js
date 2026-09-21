import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../presupuestos/services/presupuestosStorageService', () => ({
  presupuestosStorageService: {
    obtenerItemsPorPaciente: vi.fn(() => [])
  }
}))

vi.mock('../../../services/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
  })
}))

import { usePrestacionesPaciente } from './usePrestacionesPaciente'
import { presupuestosStorageService } from '../../presupuestos/services/presupuestosStorageService'

describe('usePrestacionesPaciente (Commit G1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna arrays vacíos sin pacienteId', () => {
    const { result } = renderHook(() => usePrestacionesPaciente(''))
    expect(result.current.prestacionesPaciente).toEqual([])
    expect(result.current.prestacionesSeleccionadas).toEqual([])
    expect(presupuestosStorageService.obtenerItemsPorPaciente).not.toHaveBeenCalled()
  })

  it('carga prestaciones al recibir pacienteId válido', () => {
    presupuestosStorageService.obtenerItemsPorPaciente.mockReturnValue([
      { id: 1, prestacion: 'Corona', pieza: '1.1', valor: 50000 }
    ])
    const { result } = renderHook(() => usePrestacionesPaciente(42))
    expect(presupuestosStorageService.obtenerItemsPorPaciente).toHaveBeenCalledWith(42)
    expect(result.current.prestacionesPaciente).toHaveLength(1)
  })

  it('maneja error de storage sin romper (array vacío)', () => {
    presupuestosStorageService.obtenerItemsPorPaciente.mockImplementation(() => {
      throw new Error('Storage error')
    })
    const { result } = renderHook(() => usePrestacionesPaciente(42))
    expect(result.current.prestacionesPaciente).toEqual([])
  })

  it('handleTogglePrestacion agrega item si no existe', () => {
    presupuestosStorageService.obtenerItemsPorPaciente.mockReturnValue([])
    const { result } = renderHook(() => usePrestacionesPaciente(42))

    act(() => {
      result.current.handleTogglePrestacion('Corona (1.1) - $50.000')
    })

    expect(result.current.prestacionesSeleccionadas).toEqual(['Corona (1.1) - $50.000'])
  })

  it('handleTogglePrestacion remueve item si ya existe', () => {
    presupuestosStorageService.obtenerItemsPorPaciente.mockReturnValue([])
    const { result } = renderHook(() => usePrestacionesPaciente(42))

    act(() => {
      result.current.handleTogglePrestacion('Corona (1.1) - $50.000')
    })
    act(() => {
      result.current.handleTogglePrestacion('Corona (1.1) - $50.000')
    })

    expect(result.current.prestacionesSeleccionadas).toEqual([])
  })

  it('preselecciona prestaciones en modo edición', () => {
    presupuestosStorageService.obtenerItemsPorPaciente.mockReturnValue([])
    const pagoEditar = { prestacionesImputadas: ['Corona (1.1) - $50.000'] }
    const { result } = renderHook(() => usePrestacionesPaciente(42, pagoEditar))
    expect(result.current.prestacionesSeleccionadas).toEqual(['Corona (1.1) - $50.000'])
  })

  it('resetPrestaciones limpia selección', () => {
    presupuestosStorageService.obtenerItemsPorPaciente.mockReturnValue([])
    const { result } = renderHook(() => usePrestacionesPaciente(42))

    act(() => {
      result.current.handleTogglePrestacion('Item 1')
    })
    act(() => {
      result.current.resetPrestaciones([])
    })

    expect(result.current.prestacionesSeleccionadas).toEqual([])
  })
})
