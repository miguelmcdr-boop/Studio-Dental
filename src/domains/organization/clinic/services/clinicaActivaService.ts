import { clinicStorageService, type DatosClinicaConfig } from './clinicStorageService'
import { useSesionStore } from '../../../../app/stores/sesionStore'
import { suscribirRealtimeClinica } from './clinicRealtimeService'

export const EVENT_CLINICA_ACTUALIZADA = 'clinica_actualizada'

export const sincronizarDesdeSupabase = async (clinicaId?: string | null): Promise<string | null> => {
  const id = clinicaId || useSesionStore.getState()?.clinicaActual || useSesionStore.getState()?.userProfile?.clinicaId
  if (!id) return null
  const datos = await clinicStorageService.sincronizarClinicaDesdeSupabase(id)
  return datos?.nombreClinica?.trim() || null
}

export const obtenerNombreClinica = (): string | null => {
  try {
    const config = clinicStorageService.obtenerClinica()
    if (config?.nombreClinica && typeof config.nombreClinica === 'string' && config.nombreClinica.trim()) {
      return config.nombreClinica.trim()
    }
  } catch {}
  sincronizarDesdeSupabase().catch(() => {})
  return null
}

export const guardarClinicaCompleta = async (clinicaId: string, datos: DatosClinicaConfig): Promise<boolean> => {
  return clinicStorageService.guardarClinicaCompleta(clinicaId, datos)
}

export const suscribirNombre = (cb: (nombre: string) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ nombre?: string }>
    if (custom.detail?.nombre) cb(custom.detail.nombre)
  }
  window.addEventListener(EVENT_CLINICA_ACTUALIZADA, handler)
  return () => window.removeEventListener(EVENT_CLINICA_ACTUALIZADA, handler)
}

export const notificarCambioClinica = (nombre: string): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_CLINICA_ACTUALIZADA, { detail: { nombre } }))
  }
}

export { suscribirRealtimeClinica }
