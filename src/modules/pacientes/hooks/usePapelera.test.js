import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mocks explícitos usando vi.hoisted() para que existan antes de vi.mock()
const mocks = vi.hoisted(() => ({
  mockListar: vi.fn(),
  mockRestaurar: vi.fn(),
  mockObtenerAutores: vi.fn(),
  mockRefrescar: vi.fn()
}))

vi.mock('../services/pacientesStorageService', () => ({
  pacientesStorageService: {
    listarPacientesEliminados: mocks.mockListar,
    restaurarPaciente: mocks.mockRestaurar
  }
}))

vi.mock('../services/pacientesSoftDeleteService', () => ({
  obtenerAutoresDeEliminacion: mocks.mockObtenerAutores
}))

vi.mock('../../../store/pacientesStore', () => ({
  usePacientesStore: (selector) => {
    if (selector.toString().includes('refrescarDesdeSupabase')) {
      return mocks.mockRefrescar
    }
    return []
  }
}))

vi.mock('../../../services/notificationService', () => ({
  notificationService: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

import { usePapelera } from './usePapelera'
import { notificationService } from '../../../services/notificationService'

describe('usePapelera (F6-L)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockObtenerAutores.mockResolvedValue(new Map())
    mocks.mockRefrescar.mockResolvedValue()
  })

  it('carga pacientes eliminados al montar', async () => {
    const mockPacientes = [
      { id: '1', nombre: 'Juan', rut: '12345678-9', deleted_at: '2026-08-22' }
    ]
    mocks.mockListar.mockResolvedValue(mockPacientes)

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(result.current.pacientesEliminados).toHaveLength(1)
    })
    
    expect(mocks.mockListar).toHaveBeenCalled()
    expect(result.current.pacientesEliminados[0].nombre).toBe('Juan')
    expect(result.current.pacientesEliminados[0].rut).toBe('12345678-9')
    expect(result.current.pacientesEliminados[0].eliminadoPor).toBe('Usuario desconocido')
    expect(result.current.contador).toBe(1)
  })

  it('maneja error al cargar papelera', async () => {
    mocks.mockListar.mockRejectedValue(new Error('Error'))

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(notificationService.error).toHaveBeenCalled()
    })

    expect(result.current.pacientesEliminados).toEqual([])
  })

  it('restaura paciente exitosamente', async () => {
    const mockPacientes = [{ id: '1', nombre: 'Juan' }]
    mocks.mockListar.mockResolvedValue(mockPacientes)
    mocks.mockRestaurar.mockResolvedValue(true)

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(result.current.pacientesEliminados).toHaveLength(1)
    })

    await act(async () => {
      const exito = await result.current.restaurar('1')
      expect(exito).toBe(true)
    })

    expect(mocks.mockRestaurar).toHaveBeenCalledWith('1')
    expect(notificationService.success).toHaveBeenCalled()
    expect(mocks.mockRefrescar).toHaveBeenCalled()
  })

  it('maneja error al restaurar paciente', async () => {
    mocks.mockListar.mockResolvedValue([])
    mocks.mockRestaurar.mockResolvedValue(false)

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(result.current.pacientesEliminados).toEqual([])
    })

    await act(async () => {
      const exito = await result.current.restaurar('1')
      expect(exito).toBe(false)
    })

    expect(notificationService.error).toHaveBeenCalled()
  })

  it('expone función refrescar para recargar manualmente', async () => {
    mocks.mockListar.mockResolvedValue([])

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(mocks.mockListar).toHaveBeenCalledTimes(1)
    })

    expect(typeof result.current.refrescar).toBe('function')

    await act(async () => {
      await result.current.refrescar()
    })

    expect(mocks.mockListar).toHaveBeenCalledTimes(2)
  })

  it('inicializa contador en 0', () => {
    mocks.mockListar.mockResolvedValue([])
    const { result } = renderHook(() => usePapelera())
    expect(result.current.contador).toBe(0)
  })

  it('actualiza contador al cargar pacientes', async () => {
    const mockPacientes = [
      { id: '1', nombre: 'Juan' },
      { id: '2', nombre: 'María' },
      { id: '3', nombre: 'Pedro' }
    ]
    mocks.mockListar.mockResolvedValue(mockPacientes)

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(result.current.contador).toBe(3)
    })
  })

  it('maneja excepción inesperada al restaurar', async () => {
    mocks.mockListar.mockResolvedValue([])
    mocks.mockRestaurar.mockRejectedValue(new Error('Unexpected'))

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(result.current.pacientesEliminados).toEqual([])
    })

    await act(async () => {
      const exito = await result.current.restaurar('1')
      expect(exito).toBe(false)
    })

    expect(notificationService.error).toHaveBeenCalled()
  })

  it('mergea autores de eliminación desde audit_log', async () => {
    const mockPacientes = [
      { id: '1', nombre: 'Juan', rut: '123', deleted_at: '2026-08-22' }
    ]
    const autoresMap = new Map([['1', 'admin@clinica.com']])
    mocks.mockListar.mockResolvedValue(mockPacientes)
    mocks.mockObtenerAutores.mockResolvedValue(autoresMap)

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(result.current.pacientesEliminados[0]?.eliminadoPor).toBe('admin@clinica.com')
    })
  })

  it('usa "Usuario desconocido" cuando audit_log no tiene registro', async () => {
    const mockPacientes = [
      { id: '1', nombre: 'Juan', rut: '123', deleted_at: '2026-08-22' }
    ]
    mocks.mockListar.mockResolvedValue(mockPacientes)
    mocks.mockObtenerAutores.mockResolvedValue(new Map())

    const { result } = renderHook(() => usePapelera())

    await waitFor(() => {
      expect(result.current.pacientesEliminados[0]?.eliminadoPor).toBe('Usuario desconocido')
    })
  })
})
