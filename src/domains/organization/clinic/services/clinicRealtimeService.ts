import { supabase, USE_SUPABASE } from '../../../../infrastructure/supabase/supabaseClient'
import { clinicStorageService } from './clinicStorageService'

export const suscribirRealtimeClinica = (
  clinicaId: string,
  cb: (nombre: string) => void
): (() => void) => {
  if (!USE_SUPABASE || !supabase || !clinicaId) return () => {}

  try {
    const canal = supabase
      .channel(`clinica_${clinicaId}_realtime`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clinicas',
          filter: `id=eq.${clinicaId}`,
        },
        (payload) => {
          const nuevoNombre = (payload.new as { nombre?: string })?.nombre
          if (nuevoNombre) {
            const actual = clinicStorageService.obtenerClinica() || {}
            clinicStorageService.guardarClinica({ ...actual, nombreClinica: nuevoNombre })
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('clinica_actualizada', { detail: { nombre: nuevoNombre } }))
            }
            cb(nuevoNombre)
          }
        }
      )
      .subscribe()

    const handleFocus = () => {
      clinicStorageService.sincronizarClinicaDesdeSupabase(clinicaId).then((datos) => {
        if (datos?.nombreClinica) cb(datos.nombreClinica)
      })
    }
    if (typeof window !== 'undefined') window.addEventListener('focus', handleFocus)

    return () => {
      try { supabase.removeChannel(canal) } catch {}
      if (typeof window !== 'undefined') window.removeEventListener('focus', handleFocus)
    }
  } catch {
    return () => {}
  }
}
