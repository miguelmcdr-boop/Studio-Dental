import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNombreClinica } from './useNombreClinica'
import { notificarCambioClinica } from '../../domains/organization/clinic/services/clinicaActivaService'
import { clinicStorageService } from '../../domains/organization/clinic/services/clinicStorageService'
import * as clinicRealtimeService from '../../domains/organization/clinic/services/clinicRealtimeService'
import { useSesionStore } from '../../app/stores/sesionStore'

vi.mock('../../domains/organization/clinic/services/clinicStorageService', () => ({
  clinicStorageService: {
    obtenerClinica: vi.fn(),
    sincronizarClinicaDesdeSupabase: vi.fn(),
  },
}))

describe('useNombreClinica', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSesionStore.setState({ userProfile: null, clinicaActual: null })
  })

  it('retorna fallback "Mi Consulta" si no hay nombre configurado ni perfil', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)

    const { result } = renderHook(() => useNombreClinica())
    expect(result.current).toBe('Mi Consulta')
  })

  it('toma el nombre del perfil inicial si se proporciona mientras no hay caché', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)

    const { result } = renderHook(() => useNombreClinica('Clínica Providencia'))
    expect(result.current).toBe('Clínica Providencia')
  })

  it('prioriza el nombre en caché sobre el perfil', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue({
      nombreClinica: 'Clínica Dental Mayor',
    })

    const { result } = renderHook(() => useNombreClinica('Perfil Secundario'))
    expect(result.current).toBe('Clínica Dental Mayor')
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

  it('sincroniza desde Supabase al montar cuando hay clinicaActual', async () => {
    useSesionStore.setState({ clinicaActual: 'clinica-999' })
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)
    vi.mocked(clinicStorageService.sincronizarClinicaDesdeSupabase).mockResolvedValue({
      nombreClinica: 'Clínica Sincronizada Supabase',
    })

    const { result } = renderHook(() => useNombreClinica())
    expect(result.current).toBe('Mi Consulta')

    await act(async () => {
      await Promise.resolve()
    })

    expect(clinicStorageService.sincronizarClinicaDesdeSupabase).toHaveBeenCalledWith('clinica-999')
    expect(result.current).toBe('Clínica Sincronizada Supabase')
  })

  it('se suscribe a Realtime y actualiza el nombre cuando llega un cambio', () => {
    let callbackRealtime = null
    vi.spyOn(clinicRealtimeService, 'suscribirRealtimeClinica').mockImplementation((_id, cb) => {
      callbackRealtime = cb
      return vi.fn()
    })

    useSesionStore.setState({ clinicaActual: 'clinica-realtime' })
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)

    const { result } = renderHook(() => useNombreClinica())

    expect(clinicRealtimeService.suscribirRealtimeClinica).toHaveBeenCalledWith('clinica-realtime', expect.any(Function))

    act(() => {
      if (callbackRealtime) {
        callbackRealtime('Nombre Vía Realtime')
      }
    })

    expect(result.current).toBe('Nombre Vía Realtime')
  })
})

