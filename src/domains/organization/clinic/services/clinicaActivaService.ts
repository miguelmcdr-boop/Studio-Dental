import { clinicStorageService } from './clinicStorageService'
import { useSesionStore } from '../../../../app/stores/sesionStore'

export const EVENT_CLINICA_ACTUALIZADA = 'clinica_actualizada'

export const obtenerNombreClinica = (): string => {
  try {
    const config = clinicStorageService.obtenerClinica()
    if (config?.nombreClinica && typeof config.nombreClinica === 'string' && config.nombreClinica.trim()) {
      return config.nombreClinica.trim()
    }
  } catch {}

  try {
    const sesion = useSesionStore.getState()
    const perfil = sesion?.userProfile as { clinicaNombre?: string } | null
    if (typeof perfil?.clinicaNombre === 'string' && perfil.clinicaNombre.trim()) {
      return perfil.clinicaNombre.trim()
    }
  } catch {}

  return 'Mi Consulta'
}

export const suscribirNombre = (cb: (nombre: string) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ nombre?: string }>
    cb(custom.detail?.nombre || obtenerNombreClinica())
  }
  window.addEventListener(EVENT_CLINICA_ACTUALIZADA, handler)
  return () => window.removeEventListener(EVENT_CLINICA_ACTUALIZADA, handler)
}

export const notificarCambioClinica = (nombre: string): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_CLINICA_ACTUALIZADA, { detail: { nombre } }))
  }
}
