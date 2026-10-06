import { useState, useEffect } from 'react'
import {
  obtenerNombreClinica,
  sincronizarDesdeSupabase,
  suscribirNombre,
  suscribirRealtimeClinica,
} from '../../domains/organization/clinic/services/clinicaActivaService'
import { useSesionStore } from '../../app/stores/sesionStore'

export const useNombreClinica = (perfilNombre?: unknown): string => {
  const clinicaActual = useSesionStore((s) => s.clinicaActual)

  const [nombre, setNombre] = useState<string | null>(() => {
    const cached = obtenerNombreClinica()
    if (cached) return cached
    if (typeof perfilNombre === 'string' && perfilNombre.trim()) {
      return perfilNombre.trim()
    }
    return null
  })

  // Sincronizar desde Supabase al montar o al cambiar de clínica activa
  useEffect(() => {
    let activo = true

    const cached = obtenerNombreClinica()
    if (cached) {
      setNombre(cached)
    }

    sincronizarDesdeSupabase(clinicaActual).then((nombreSync) => {
      if (activo && nombreSync) {
        setNombre(nombreSync)
      }
    }).catch(() => {})

    return () => {
      activo = false
    }
  }, [clinicaActual])

  // Suscribirse a eventos locales de actualización ('clinica_actualizada')
  useEffect(() => {
    const unsubscribe = suscribirNombre((nuevoNombre) => {
      if (nuevoNombre && typeof nuevoNombre === 'string') {
        setNombre(nuevoNombre.trim())
      }
    })
    return unsubscribe
  }, [])

  // Suscribirse a Realtime de Supabase en la tabla clinicas
  useEffect(() => {
    if (!clinicaActual) return

    const unsubscribeRealtime = suscribirRealtimeClinica(clinicaActual, (nuevoNombre) => {
      if (nuevoNombre && typeof nuevoNombre === 'string') {
        setNombre(nuevoNombre.trim())
      }
    })

    return () => {
      unsubscribeRealtime()
    }
  }, [clinicaActual])

  // Fallback visual UI (nunca persistido)
  return nombre || (typeof perfilNombre === 'string' && perfilNombre.trim()) || 'Mi Consulta'
}

