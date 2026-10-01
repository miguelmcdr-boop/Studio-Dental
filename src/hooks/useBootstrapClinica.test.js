import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBootstrapClinica } from './useBootstrapClinica'

// Mock de authService
vi.mock('../services/authService', () => ({
  bootstrapClinica: vi.fn()
}))

// Mock de logger
vi.mock('../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  })
}))

import { bootstrapClinica } from '../services/authService'

describe('useBootstrapClinica', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe inicializar en paso 1 con datos vacíos', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    expect(result.current.paso).toBe(1)
    expect(result.current.datos.nombre).toBe('')
    expect(result.current.datos.rutEmpresa).toBe('')
    expect(result.current.procesando).toBe(false)
    expect(result.current.errorGeneral).toBeNull()
  })

  it('debe actualizar campos correctamente', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.actualizarCampo('nombre', 'Clínica Test')
    })

    expect(result.current.datos.nombre).toBe('Clínica Test')
  })

  it('debe validar nombre vacío en paso 1', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.avanzarPaso()
    })

    expect(result.current.paso).toBe(1) // No avanza
    expect(result.current.errores.nombre).toContain('3 caracteres')
  })

  it('debe validar nombre muy corto en paso 1', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.actualizarCampo('nombre', 'AB')
    })

    act(() => {
      result.current.avanzarPaso()
    })

    expect(result.current.paso).toBe(1)
    expect(result.current.errores.nombre).toContain('3 caracteres')
  })

  it('debe avanzar a paso 2 con nombre válido', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.actualizarCampo('nombre', 'Clínica Test')
    })

    act(() => {
      result.current.avanzarPaso()
    })

    expect(result.current.paso).toBe(2)
    expect(result.current.errores.nombre).toBeUndefined()
  })

  it('debe validar RUT chileno inválido en paso 2', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.actualizarCampo('nombre', 'Clínica Test')
    })

    act(() => {
      result.current.avanzarPaso()
    })

    act(() => {
      result.current.actualizarCampo('rutEmpresa', '12.345.678-9') // RUT inválido
    })

    act(() => {
      result.current.avanzarPaso()
    })

    expect(result.current.paso).toBe(2) // No avanza
    expect(result.current.errores.rutEmpresa).toBe('RUT inválido')
  })

  it('debe aceptar RUT chileno válido en paso 2', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.actualizarCampo('nombre', 'Clínica Test')
    })

    act(() => {
      result.current.avanzarPaso()
    })

    act(() => {
      result.current.actualizarCampo('rutEmpresa', '11.111.111-1') // RUT válido (módulo 11: 11*1+11*1+11*1+11*1+11*1+11*1+11*1 = 77, 11-(77%11)=0, dv=0 pero usamos 1 para test)
    })

    act(() => {
      result.current.avanzarPaso()
    })

    expect(result.current.paso).toBe(3) // Avanza a paso 3
  })

  it('debe retroceder de paso 2 a paso 1', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.actualizarCampo('nombre', 'Clínica Test')
    })

    act(() => {
      result.current.avanzarPaso()
    })

    act(() => {
      result.current.retrocederPaso()
    })

    expect(result.current.paso).toBe(1)
  })

  it('debe crear clínica exitosamente en paso 3', async () => {
    bootstrapClinica.mockResolvedValue({ success: true, clinicaId: 'clinica-123' })
    const onComplete = vi.fn()

    const { result } = renderHook(() => useBootstrapClinica(onComplete))

    await act(async () => {
      result.current.actualizarCampo('nombre', 'Clínica Test')
    })

    await act(async () => {
      result.current.avanzarPaso()
    })

    await act(async () => {
      result.current.avanzarPaso()
    })

    await act(async () => {
      result.current.handleSubmit({ preventDefault: vi.fn() })
    })

    expect(bootstrapClinica).toHaveBeenCalledWith({
      nombre: 'Clínica Test',
      rutEmpresa: '',
      direccion: '',
      telefono: '',
      emailContacto: ''
    })
    expect(result.current.procesando).toBe(false)
  })

  it('debe manejar error del servidor', async () => {
    bootstrapClinica.mockResolvedValue({ 
      success: false, 
      error: 'Ya existe una clínica con este RUT' 
    })

    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    await act(async () => {
      result.current.actualizarCampo('nombre', 'Clínica Test')
    })

    await act(async () => {
      result.current.avanzarPaso()
    })

    await act(async () => {
      result.current.avanzarPaso()
    })

    await act(async () => {
      result.current.handleSubmit({ preventDefault: vi.fn() })
    })

    expect(result.current.errorGeneral).toBe('Ya existe una clínica con este RUT')
  })

  it('debe limpiar error al editar campo', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.avanzarPaso() // Genera error de nombre
    })

    expect(result.current.errores.nombre).toBeDefined()

    act(() => {
      result.current.actualizarCampo('nombre', 'Clínica Test')
    })

    expect(result.current.errores.nombre).toBeNull()
  })
})
