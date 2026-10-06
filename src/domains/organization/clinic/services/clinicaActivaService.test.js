import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  obtenerNombreClinica,
  sincronizarDesdeSupabase,
  guardarClinicaCompleta,
  suscribirNombre,
  notificarCambioClinica,
} from './clinicaActivaService'
import { clinicStorageService } from './clinicStorageService'
import { useSesionStore } from '../../../../app/stores/sesionStore'

vi.mock('./clinicStorageService', () => ({
  clinicStorageService: {
    obtenerClinica: vi.fn(),
    sincronizarClinicaDesdeSupabase: vi.fn(),
    guardarClinicaCompleta: vi.fn(),
  },
}))

describe('clinicaActivaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSesionStore.setState({
      userProfile: null,
      clinicaActual: null,
      sedeActual: null,
    })
  })

  it('obtiene el nombre desde clinicStorageService cuando existe', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue({
      nombreClinica: 'Clínica Dental Los Andes',
    })

    expect(obtenerNombreClinica()).toBe('Clínica Dental Los Andes')
  })

  it('devuelve null y dispara sincronización async si clinicStorageService está vacío', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)
    vi.mocked(clinicStorageService.sincronizarClinicaDesdeSupabase).mockResolvedValue({
      nombreClinica: 'Clínica Sincronizada',
    })
    useSesionStore.setState({
      clinicaActual: 'clinica-123',
    })

    const resultado = obtenerNombreClinica()
    expect(resultado).toBeNull()
    expect(clinicStorageService.sincronizarClinicaDesdeSupabase).toHaveBeenCalledWith('clinica-123')
  })

  it('sincronizarDesdeSupabase recupera y formatea el nombre', async () => {
    vi.mocked(clinicStorageService.sincronizarClinicaDesdeSupabase).mockResolvedValue({
      nombreClinica: '  Clínica Central  ',
    })

    const res = await sincronizarDesdeSupabase('clinica-abc')
    expect(clinicStorageService.sincronizarClinicaDesdeSupabase).toHaveBeenCalledWith('clinica-abc')
    expect(res).toBe('Clínica Central')
  })

  it('guardarClinicaCompleta delega en clinicStorageService', async () => {
    vi.mocked(clinicStorageService.guardarClinicaCompleta).mockResolvedValue(true)

    const ok = await guardarClinicaCompleta('clinica-abc', { nombreClinica: 'Nueva' })
    expect(clinicStorageService.guardarClinicaCompleta).toHaveBeenCalledWith('clinica-abc', { nombreClinica: 'Nueva' })
    expect(ok).toBe(true)
  })

  it('suscribirNombre y notificarCambioClinica sincronizan a los suscriptores', () => {
    const callback = vi.fn()
    const desuscribir = suscribirNombre(callback)

    notificarCambioClinica('Clínica Sincronizada En Vivo')

    expect(callback).toHaveBeenCalledWith('Clínica Sincronizada En Vivo')

    desuscribir()
    notificarCambioClinica('Otra Clínica')
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
