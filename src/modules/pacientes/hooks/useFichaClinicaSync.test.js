import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFichaClinicaSync } from './useFichaClinicaSync'
import {
  sincronizarPaciente,
  limpiarCachePaciente
} from '../../../services/datosClinicosSupabase'

// Mock del servicio de Supabase
vi.mock('../../../services/datosClinicosSupabase', () => ({
  sincronizarPaciente: vi.fn(),
  limpiarCachePaciente: vi.fn()
}))

describe('useFichaClinicaSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('llama a sincronizarPaciente al montar con pacienteId válido', async () => {
    sincronizarPaciente.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useFichaClinicaSync('test-paciente-id'))

    // Esperar a que la promesa se resuelva Y el estado se actualice
    await vi.waitFor(() => {
      expect(sincronizarPaciente).toHaveBeenCalledWith('test-paciente-id')
      expect(result.current.sincronizando).toBe(false)
    })

    expect(result.current.error).toBe(null)
  })

  it('NO llama a sincronizarPaciente si pacienteId es null', async () => {
    const { result } = renderHook(() => useFichaClinicaSync(null))

    await vi.waitFor(() => {
      expect(sincronizarPaciente).not.toHaveBeenCalled()
    })

    expect(result.current.sincronizando).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('NO llama a sincronizarPaciente si pacienteId es undefined', async () => {
    const { result } = renderHook(() => useFichaClinicaSync(undefined))

    await vi.waitFor(() => {
      expect(sincronizarPaciente).not.toHaveBeenCalled()
    })

    expect(result.current.sincronizando).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('llama a limpiarCachePaciente al desmontar', async () => {
    sincronizarPaciente.mockResolvedValueOnce(undefined)

    const { unmount } = renderHook(() => useFichaClinicaSync('test-paciente-id'))

    await vi.waitFor(() => {
      expect(sincronizarPaciente).toHaveBeenCalled()
    })

    unmount()

    expect(limpiarCachePaciente).toHaveBeenCalledWith('test-paciente-id')
  })

  it('maneja errores de sincronización sin romper el componente', async () => {
    const error = new Error('Error de conexión')
    sincronizarPaciente.mockRejectedValueOnce(error)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useFichaClinicaSync('test-paciente-id'))

    await vi.waitFor(() => {
      expect(result.current.error).toBe('Error de conexión')
    })

    expect(result.current.sincronizando).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('expone sincronizando=true durante la sincronización', async () => {
    let resolvePromise
    sincronizarPaciente.mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve
    }))

    const { result } = renderHook(() => useFichaClinicaSync('test-paciente-id'))

    // Inicialmente sincronizando es true
    expect(result.current.sincronizando).toBe(true)

    // Resolver la promesa
    resolvePromise()
    await vi.waitFor(() => {
      expect(result.current.sincronizando).toBe(false)
    })
  })

  it('expone sincronizando=false si no hay pacienteId', () => {
    const { result } = renderHook(() => useFichaClinicaSync(null))

    expect(result.current.sincronizando).toBe(false)
    expect(result.current.error).toBe(null)
  })
})
