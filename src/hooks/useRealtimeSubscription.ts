/**
 * Hook React para suscribirse a cambios de una tabla en Supabase Realtime (F5-01).
 *
 * Maneja automáticamente:
 * - Suscripción al montar el componente
 * - Desuscripción al desmontar (cleanup automático, sin memory leaks)
 * - Re-suscripción limpia si cambia la tabla o el evento
 * - Desactivación condicional vía parámetro `enabled`
 *
 * Uso básico:
 *   useRealtimeSubscription('citas', (payload) => {
 *     log.info('Cambio en citas:', payload)
 *   })
 *
 * Con opciones:
 *   useRealtimeSubscription(
 *     'citas',
 *     (payload) => { ... },
 *     { evento: 'INSERT', enabled: usuarioLogueado }
 *   )
 *
 * Con filtro:
 *   useRealtimeSubscription(
 *     'citas',
 *     (payload) => { ... },
 *     { filtro: { columna: 'paciente_id', valor: pacienteId } }
 *   )
 */
import { useEffect, useRef } from 'react'
import {
  suscribirseATabla,
  type RealtimeEventType,
  type RealtimeFilter,
  type RealtimePayload,
  type RealtimeCallback,
  type RealtimeSubscription
} from '../services/realtimeService'
import { createLogger } from '../services/logger'

const _log = createLogger('useRealtimeSubscription')

export interface UseRealtimeSubscriptionOptions {
  evento?: RealtimeEventType
  filtro?: RealtimeFilter
  enabled?: boolean
}

/**
 * Hook de suscripción a cambios de Realtime.
 *
 * @param tabla - Nombre de la tabla a escuchar
 * @param callback - Función a invocar al recibir evento
 * @param opciones - Opciones adicionales
 */
export const useRealtimeSubscription = <T = Record<string, unknown>>(
  tabla: string,
  callback: RealtimeCallback<T>,
  opciones: UseRealtimeSubscriptionOptions = {}
): void => {
  const { evento = '*', filtro, enabled = true } = opciones

  // Ref para mantener el callback actualizado sin re-suscribir
  const callbackRef = useRef<RealtimeCallback<T>>(callback)
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Ref estable para pasar al servicio (evita re-suscripciones por cambio de callback)
  const stableCallback = useRef((payload: RealtimePayload<T>) => {
    callbackRef.current(payload)
  }).current

  useEffect(() => {
    // No suscribirse si está deshabilitado o si falta la tabla
    if (!enabled || !tabla) {
      return
    }

    // Suscribirse al canal
    const subscription: RealtimeSubscription | null = suscribirseATabla(
      tabla,
      stableCallback as unknown as RealtimeCallback<Record<string, unknown>>,
      {
        evento,
        filtro
      }
    )

    // Cleanup: desuscribirse al desmontar o cuando cambien las dependencias
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
    // Re-suscribir si cambia tabla, evento, filtro o enabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla, evento, JSON.stringify(filtro), enabled])
}
