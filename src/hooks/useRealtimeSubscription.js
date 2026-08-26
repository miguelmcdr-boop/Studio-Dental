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
import { suscribirseATabla } from '../services/realtimeService'
import { createLogger } from '../services/logger.js'

const log = createLogger('useRealtimeSubscription')

/**
 * Hook de suscripción a cambios de Realtime.
 *
 * @param {string} tabla - Nombre de la tabla a escuchar
 * @param {Function} callback - Función a invocar al recibir evento
 * @param {Object} opciones - Opciones adicionales
 * @param {string} opciones.evento - Tipo de evento ('INSERT', 'UPDATE', 'DELETE', '*'). Default: '*'
 * @param {Object} opciones.filtro - Filtro por columna. Ej: { columna: 'paciente_id', valor: uuid }
 * @param {boolean} opciones.enabled - Si es false, no se suscribe. Default: true
 */
export const useRealtimeSubscription = (tabla, callback, opciones = {}) => {
  const { evento = '*', filtro, enabled = true } = opciones

  // Ref para mantener el callback actualizado sin re-suscribir
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Ref estable para pasar al servicio (evita re-suscripciones por cambio de callback)
  const stableCallback = useRef((payload) => {
    callbackRef.current(payload)
  }).current

  useEffect(() => {
    // No suscribirse si está deshabilitado o si falta la tabla
    if (!enabled || !tabla) {
      return
    }

    // Suscribirse al canal
    const subscription = suscribirseATabla(tabla, stableCallback, {
      evento,
      filtro
    })

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

