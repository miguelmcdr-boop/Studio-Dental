/**
 * Servicio centralizado de Supabase Realtime (F5-01).
 *
 * Gestiona suscripciones a cambios en tablas de Supabase en tiempo real.
 * Cada suscripción se filtra automáticamente por el usuario autenticado
 * gracias a las políticas de Row Level Security (RLS) configuradas en Supabase.
 *
 * API pública:
 * - suscribirseATabla(tabla, callback, opciones) → { unsubscribe } | null
 *
 * Características:
 * - Filtrado automático por RLS (Supabase solo envía eventos del user_id actual)
 * - Nombres de canales únicos (tabla + timestamp + aleatorio)
 * - Manejo graceful si Supabase no está configurado (retorna null)
 * - Soporte para filtros personalizados (ej: por paciente_id)
 * - Cleanup explícito vía método unsubscribe()
 *
 * Uso:
 *   const sub = realtimeService.suscribirseATabla('citas', (payload) => {
 *     log.info('Cambio en citas:', payload)
 *   })
 *
 *   // Cuando ya no necesites la suscripción:
 *   sub.unsubscribe()
 *
 * Tipos de eventos soportados:
 * - 'INSERT': nuevo registro creado
 * - 'UPDATE': registro modificado
 * - 'DELETE': registro eliminado
 * - '*': todos los eventos (default)
 */
import { supabase, USE_SUPABASE } from './supabaseClient'
import { createLogger } from './logger'

const log = createLogger('realtimeService')

/**
 * Genera un nombre único para el canal de Realtime.
 * Evita colisiones entre múltiples suscripciones a la misma tabla.
 *
 * @param {string} tabla - Nombre de la tabla
 * @returns {string} Nombre único del canal
 */
const generarNombreCanal = (tabla) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `canal_${tabla}_${timestamp}_${random}`
}

/**
 * Se suscribe a cambios en una tabla de Supabase.
 *
 * @param {string} tabla - Nombre de la tabla (ej: 'citas', 'pacientes')
 * @param {Function} callback - Función a invocar cuando hay un cambio.
 *                              Recibe el payload con la estructura:
 *                              {
 *                                eventType: 'INSERT' | 'UPDATE' | 'DELETE',
 *                                new: objeto con los datos nuevos (para INSERT/UPDATE),
 *                                old: objeto con los datos anteriores (para UPDATE/DELETE),
 *                                schema: 'public',
 *                                table: nombre de la tabla,
 *                                commit_timestamp: timestamp ISO
 *                              }
 * @param {Object} opciones - Opciones opcionales
 * @param {string} opciones.evento - Tipo de evento a escuchar ('INSERT', 'UPDATE', 'DELETE', '*'). Default: '*'
 * @param {Object} opciones.filtro - Filtro opcional por columna. Ej: { columna: 'paciente_id', valor: 'uuid' }
 * @returns {{ unsubscribe: Function } | null} Objeto con método unsubscribe, o null si Supabase no está configurado
 */
export const suscribirseATabla = (tabla, callback, opciones = {}) => {
  if (!USE_SUPABASE || !supabase) {
    console.info(`[realtimeService] Supabase no configurado, omitiendo suscripción a ${tabla}`)
    return null
  }

  if (!tabla || typeof tabla !== 'string') {
    log.error('Nombre de tabla inválido:', tabla)
    return null
  }

  if (typeof callback !== 'function') {
    log.error('Callback debe ser una función')
    return null
  }

  const { evento = '*', filtro } = opciones
  const nombreCanal = generarNombreCanal(tabla)

  try {
    const channel = supabase.channel(nombreCanal)

    // Construir configuración de postgres_changes
    const config = {
      event: evento,
      schema: 'public',
      table: tabla
    }

    // Agregar filtro si se especificó
    if (filtro && filtro.columna && filtro.valor !== undefined) {
      config.filter = `${filtro.columna}=eq.${filtro.valor}`
    }

    // Suscribirse al canal
    const subscription = channel
      .on('postgres_changes', config, (payload) => {
        try {
          callback(payload)
        } catch (error) {
          log.error(`Error en callback de ${tabla}:`, error)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          log.info(`Suscrito a ${tabla} (evento: ${evento})`)
        } else if (status === 'CHANNEL_ERROR') {
          log.error(`Error en canal ${nombreCanal}`)
        } else if (status === 'TIMED_OUT') {
          log.warn(`Timeout en suscripción a ${tabla}`)
        }
      })

    return {
      unsubscribe: () => {
        try {
          supabase.removeChannel(subscription)
          log.info(`Desuscrito de ${tabla}`)
        } catch (error) {
          log.error(`Error al desuscribir de ${tabla}:`, error)
        }
      },
      channel: subscription
    }
  } catch (error) {
    log.error(`Error al suscribirse a ${tabla}:`, error)
    return null
  }
}

/**
 * Servicio exportado como objeto para consistencia con otros storage services.
 */
export const realtimeService = {
  suscribirseATabla
}
