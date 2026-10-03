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

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface RealtimeFilter {
  columna: string
  valor: string | number | boolean
}

export interface RealtimeOptions {
  evento?: RealtimeEventType
  filtro?: RealtimeFilter
}

export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
  commit_timestamp: string
  [key: string]: unknown
}

export type RealtimeCallback<T = Record<string, unknown>> = (payload: RealtimePayload<T>) => void

export interface RealtimeSubscription {
  unsubscribe: () => void
  channel: unknown
}

/**
 * Genera un nombre único para el canal de Realtime.
 * Evita colisiones entre múltiples suscripciones a la misma tabla.
 */
const generarNombreCanal = (tabla: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `canal_${tabla}_${timestamp}_${random}`
}

/**
 * Se suscribe a cambios en una tabla de Supabase.
 */
export const suscribirseATabla = <T = Record<string, unknown>>(
  tabla: string,
  callback: RealtimeCallback<T>,
  opciones: RealtimeOptions = {}
): RealtimeSubscription | null => {
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
    const config: Record<string, unknown> = {
      event: evento,
      schema: 'public',
      table: tabla
    }

    // Agregar filtro si se especificó
    if (filtro && filtro.columna && filtro.valor !== undefined) {
      config.filter = `${filtro.columna}=eq.${filtro.valor}`
    }

    // Suscribirse al canal
    const subscription = (channel as any)
      .on('postgres_changes', config, (payload: unknown) => {
        try {
          callback(payload as RealtimePayload<T>)
        } catch (error) {
          log.error(`Error en callback de ${tabla}:`, error)
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          log.info(`Suscrito a ${tabla} (evento: ${evento})`)
        } else if (status === 'CHANNEL_ERROR') {
          log.error(`Error en canal ${nombreCanal}`)
        } else if (status === 'TIMED_OUT') {
          log.warn(`Timeout en suscripción a ${tabla}`)
        }
      })

    return {
      unsubscribe: (): void => {
        try {
          if (supabase) {
            supabase.removeChannel(subscription)
          }
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
