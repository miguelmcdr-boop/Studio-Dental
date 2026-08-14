import React, { useState, useEffect } from 'react'
import { estaOnline } from '../services/supabaseClient'

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
export const ConnectionIndicator = () => {
  const [estado, setEstado] = useState('online') // 'online' | 'offline' | 'conectando'

  useEffect(() => {
    let activo = true
    let intervalId = null

    const verificarConexion = async () => {
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
    const handleOnline = () => {
      setEstado('conectando')
      verificarConexion()
    }

    const handleOffline = () => {
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

  const config = {
    online: {
      color: 'bg-green-500',
      text: 'text-green-700',
      label: 'Conectado',
      title: 'Sincronización en tiempo real activa'
    },
    offline: {
      color: 'bg-red-500',
      text: 'text-red-700',
      label: 'Sin conexión',
      title: 'Trabajando offline. Los cambios se sincronizarán al volver la conexión.'
    },
    conectando: {
      color: 'bg-yellow-500',
      text: 'text-yellow-700',
      label: 'Conectando...',
      title: 'Verificando conexión...'
    }
  }

  const c = config[estado] || config.offline

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 ${c.text} text-xs`}
      title={c.title}
    >
      <div className="relative flex items-center">
        <span className={`w-2 h-2 rounded-full ${c.color}`} />
        {estado === 'online' && (
          <span className={`absolute w-2 h-2 rounded-full ${c.color} animate-ping opacity-75`} />
        )}
      </div>
      <span className="font-medium">{c.label}</span>
    </div>
  )
}
