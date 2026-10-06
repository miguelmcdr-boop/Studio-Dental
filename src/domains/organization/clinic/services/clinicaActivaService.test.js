import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  obtenerNombreClinica,
  suscribirNombre,
  notificarCambioClinica,
  EVENT_CLINICA_ACTUALIZADA,
} from './clinicaActivaService'
import { clinicStorageService } from './clinicStorageService'
import { useSesionStore } from '../../../../app/stores/sesionStore'

vi.mock('./clinicStorageService', () => ({
  clinicStorageService: {
    obtenerClinica: vi.fn(),
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

  it('usa fallback de perfil si clinicStorageService está vacío', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)
    useSesionStore.setState({
      userProfile: { email: 'admin@test.cl', clinicaNombre: 'Consulta Doctor Gómez' },
    })

    expect(obtenerNombreClinica()).toBe('Consulta Doctor Gómez')
  })

  it('usa fallback final "Mi Consulta" cuando no hay clínica en storage ni perfil', () => {
    vi.mocked(clinicStorageService.obtenerClinica).mockReturnValue(undefined)
    useSesionStore.setState({ userProfile: null })

    expect(obtenerNombreClinica()).toBe('Mi Consulta')
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
