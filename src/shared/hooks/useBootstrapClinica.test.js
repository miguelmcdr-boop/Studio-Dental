import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBootstrapClinica } from './useBootstrapClinica'

// Mock de authService preservando getClinicaActivaSync
vi.mock('../../infrastructure/auth/authService', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    bootstrapClinica: vi.fn(),
    getClinicaActivaSync: vi.fn(() => 'clinica-123'),
  }
})

// Mock de sedesService
vi.mock('../../domains/organization/clinic/services/sedesService', () => ({
  sedesService: {
    guardarSedes: vi.fn(),
    establecerSedeActiva: vi.fn(),
    obtenerSedes: vi.fn(() => []),
  },
}))

// Mock de logger
vi.mock('../../infrastructure/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { bootstrapClinica } from '../../infrastructure/auth/authService'
import { sedesService } from '../../domains/organization/clinic/services/sedesService'

describe('useBootstrapClinica (4 pasos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe inicializar en paso 1 con tipo clínica y datos vacíos', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    expect(result.current.paso).toBe(1)
    expect(result.current.tipoActividad).toBe('clinica')
    expect(result.current.datos.nombre).toBe('')
    expect(result.current.procesando).toBe(false)
    expect(result.current.errorGeneral).toBeNull()
    expect(result.current.completado).toBe(false)
  })

  it('debe permitir cambiar tipo de actividad en paso 1', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.setTipoActividad('individual')
    })

    expect(result.current.tipoActividad).toBe('individual')
  })

  it('debe avanzar de paso 1 a paso 2 sin validación de datos', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.avanzarPaso()
    })

    expect(result.current.paso).toBe(2)
  })

  it('debe validar nombre y dirección en paso 2', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    // Paso 1 -> Paso 2
    act(() => {
      result.current.avanzarPaso()
    })
    expect(result.current.paso).toBe(2)

    // Intenta avanzar sin datos
    act(() => {
      result.current.avanzarPaso()
    })
    expect(result.current.paso).toBe(2)
    expect(result.current.errores.nombre).toContain('3 caracteres')
    expect(result.current.errores.direccion).toContain('obligatoria')
  })

  it('debe avanzar a paso 3 con nombre y dirección válidos', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.avanzarPaso() // a paso 2
    })

    act(() => {
      result.current.actualizarCampo('nombre', 'Clínica Odontológica Central')
      result.current.actualizarCampo('direccion', 'Av. Providencia 1234')
    })

    act(() => {
      result.current.avanzarPaso() // a paso 3
    })

    expect(result.current.paso).toBe(3)
    expect(result.current.sedes.length).toBeGreaterThan(0)
  })

  it('debe permitir agregar y eliminar sedes en paso 3', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.agregarSede({
        nombre: 'Sucursal Las Condes',
        direccion: 'Apoquindo 4500',
        comuna: 'Las Condes',
        region: 'Metropolitana',
        activa: true,
      })
    })

    expect(result.current.sedes).toHaveLength(1)
    expect(result.current.sedes[0].nombre).toBe('Sucursal Las Condes')

    act(() => {
      result.current.eliminarSede(0)
    })

    expect(result.current.sedes).toHaveLength(0)
  })

  it('debe permitir agregar y eliminar miembros en paso 4', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.agregarMiembro({
        email: 'colega@clinica.cl',
        rol: 'dentista',
        sedes: ['Sede Principal'],
      })
    })

    expect(result.current.equipo).toHaveLength(1)
    expect(result.current.equipo[0].email).toBe('colega@clinica.cl')

    act(() => {
      result.current.eliminarMiembro(0)
    })

    expect(result.current.equipo).toHaveLength(0)
  })

  it('debe retroceder pasos correctamente', () => {
    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    act(() => {
      result.current.avanzarPaso() // a paso 2
    })
    expect(result.current.paso).toBe(2)

    act(() => {
      result.current.retrocederPaso() // a paso 1
    })
    expect(result.current.paso).toBe(1)
  })

  it('debe crear clínica y sedes exitosamente en handleSubmit', async () => {
    bootstrapClinica.mockResolvedValue({ success: true, clinicaId: 'clinica-123' })
    const onComplete = vi.fn()

    const { result } = renderHook(() => useBootstrapClinica(onComplete))

    act(() => {
      result.current.actualizarCampo('nombre', 'Clínica Dental Pro')
      result.current.actualizarCampo('direccion', 'Calle Principal 100')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(bootstrapClinica).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Clínica Dental Pro',
        direccion: 'Calle Principal 100',
      })
    )
    expect(sedesService.guardarSedes).toHaveBeenCalled()
    expect(result.current.completado).toBe(true)
    expect(result.current.procesando).toBe(false)
  })

  it('debe manejar error al fallar bootstrapClinica', async () => {
    bootstrapClinica.mockResolvedValue({
      success: false,
      error: 'Error de prueba en el servidor',
    })

    const { result } = renderHook(() => useBootstrapClinica(vi.fn()))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.errorGeneral).toBe('Error de prueba en el servidor')
    expect(result.current.completado).toBe(false)
    expect(result.current.procesando).toBe(false)
  })
})
