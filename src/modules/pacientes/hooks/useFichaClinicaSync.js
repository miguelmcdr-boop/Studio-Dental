/**
 * F6-D-1: Hook de sincronización de datos clínicos desde Supabase.
 *
 * Sincroniza todos los datos clínicos del paciente (odontograma, perio,
 * evoluciones, recetas) desde Supabase al abrir la ficha, y limpia la
 * caché al cerrarla (desmontar el componente).
 *
 * Uso:
 *   const { sincronizando, error } = useFichaClinicaSync(paciente?.id)
 *
 * Coherente con D53 (hook unificado de sincronización) y RFC F4-01
 * (offline-first con fallback a localStorage).
 */
import { useEffect, useState } from 'react'
import {
  sincronizarPaciente,
  limpiarCachePaciente
} from '../../../services/datosClinicosSupabase'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('useFichaClinicaSync')

/**
 * Sincroniza los datos clínicos de un paciente desde Supabase.
 *
 * @param {string|null|undefined} pacienteId - UUID del paciente en Supabase
 * @returns {{ sincronizando: boolean, error: string|null }}
 */
export const useFichaClinicaSync = (pacienteId) => {
  const [sincronizando, setSincronizando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // F6-D-1: no sincronizar si no hay pacienteId (paciente nuevo sin guardar)
    if (!pacienteId) return

    let cancelled = false

    const ejecutarSync = async () => {
      setSincronizando(true)
      setError(null)
      try {
        await sincronizarPaciente(pacienteId)
      } catch (err) {
        // F6-D-1: si Supabase falla, no romper la ficha — el fallback
        // a localStorage sigue funcionando (RFC F4-01 offline-first)
        log.error('Error sincronizando paciente:', err)
        if (!cancelled) setError(err.message || 'Error desconocido')
      } finally {
        if (!cancelled) setSincronizando(false)
      }
    }

    ejecutarSync()

    // Cleanup: limpiar caché al cerrar la ficha
    return () => {
      cancelled = true
      try {
        limpiarCachePaciente(pacienteId)
      } catch (err) {
        log.warn('Error limpiando caché:', err)
      }
    }
  }, [pacienteId])

  return { sincronizando, error }
}
