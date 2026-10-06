import React, { useState, useEffect } from 'react'
import { estaOnline } from '../../infrastructure/supabase/supabaseClient'

/**
 * Indicador de estado de conexión (F5-05).
 *
 * Muestra 3 estados:
 * - Online (verde): conexión operativa
 * - Offline (rojo): sin conexión
 * - Conectando (amarillo): verificando estado
 *
 * Se monta en el Sidebar (footer). Hace ping cada 30s para verificar.
 */
export type ConnectionState = 'online' | 'offline' | 'conectando'

interface StateConfig {
  color: string
  text: string
  label: string
  title: string
}

export interface ConnectionIndicatorProps {
  compact?: boolean
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ compact = false }) => {
  const [estado, setEstado] = useState<ConnectionState>('online')

  useEffect(() => {
    let activo = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const verificarConexion = async (): Promise<void> => {
      // Verificación rápida con navigator.onLine
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (activo) setEstado('offline')
        return
      }

      // Ping a Supabase
      if (activo) setEstado('conectando')
      const online = await estaOnline()
      if (activo) {
        setEstado(online ? 'online' : 'offline')
      }
    }

    // Verificación inicial
    verificarConexion()

    // Listeners de navegador
    const handleOnline = (): void => {
      setEstado('conectando')
      verificarConexion()
    }

    const handleOffline = (): void => {
      setEstado('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Polling cada 30 segundos
    intervalId = setInterval(verificarConexion, 30000)

    return () => {
      activo = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const config: Record<ConnectionState, StateConfig> = {
    online: {
      color: 'bg-green-500',
      text: 'text-green-700',
      label: 'Conectado',
      title: 'Sincronización en tiempo real activa',
    },
    offline: {
      color: 'bg-red-500',
      text: 'text-red-700',
      label: 'Sin conexión',
      title: 'Trabajando offline. Los cambios se sincronizarán al volver la conexión.',
    },
    conectando: {
      color: 'bg-yellow-500',
      text: 'text-yellow-700',
      label: 'Conectando...',
      title: 'Verificando conexión...',
    },
  }

  const c = config[estado] || config.offline

  if (compact) {
    return (
      <div
        className="flex items-center justify-center p-1 cursor-pointer select-none"
        title="Conectado"
        aria-label="Conectado"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-graphite-800/60 ${c.text} text-[11px] truncate cursor-pointer select-none`}
      title={c.title}
    >
      <div className="relative flex items-center shrink-0">
        <span className={`w-2 h-2 rounded-full ${c.color}`} />
        {estado === 'online' && (
          <span className={`absolute w-2 h-2 rounded-full ${c.color} animate-ping opacity-75`} />
        )}
      </div>
      <span className="font-medium truncate">{c.label}</span>
    </div>
  )
}

ConnectionIndicator.displayName = 'ConnectionIndicator'
