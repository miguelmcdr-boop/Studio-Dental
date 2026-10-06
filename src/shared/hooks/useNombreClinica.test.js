import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNombreClinica } from './useNombreClinica'
import { notificarCambioClinica } from '../../domains/organization/clinic'
import { clinicStorageService } from '../../domains/organization/clinic/services/clinicStorageService'
import { useSesionStore } from '../../app/stores/sesionStore'

vi.mock('../../domains/organization/clinic/services/clinicStorageService', () => ({
  clinicStorageService: {
    obtenerClinica: vi.fn(),
  },
}))

describe('useNombreClinica', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSesionStore.setState({ userProfile: null })
  })

  it('retorna fallback "Mi Consulta" si no hay nombre configurado', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)

    const { result } = renderHook(() => useNombreClinica())
    expect(result.current).toBe('Mi Consulta')
  })

  it('toma el nombre del perfil inicial si se proporciona', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)

    const { result } = renderHook(() => useNombreClinica('Clínica Providencia'))
    expect(result.current).toBe('Clínica Providencia')
  })

  it('reacciona en vivo a eventos clinica_actualizada', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)

    const { result } = renderHook(() => useNombreClinica())
    expect(result.current).toBe('Mi Consulta')

    act(() => {
      notificarCambioClinica('Nueva Clínica Central')
    })

    expect(result.current).toBe('Nueva Clínica Central')
  })
})
