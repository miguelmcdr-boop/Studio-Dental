/**
 * Hook para manejo de cola offline-first (F5-03).
 *
 * Escucha eventos online/offline del navegador y procesa la cola
 * de operaciones pendientes cuando vuelve la conexión.
 *
 * Uso:
 *   useOfflineQueue()  // en App.jsx
 */
import { useEffect } from 'react'
import { operationQueue } from '../services/operationQueue'
import { notificationService } from '../services/notificationService'
import { createLogger } from '../services/logger.js'

const log = createLogger('useOfflineQueue')

export const useOfflineQueue = () => {
  useEffect(() => {
    const handleOnline = () => {
      log.info('[App] Conexión restaurada, procesando cola offline...')
      operationQueue.processQueue()
    }

    const handleOffline = () => {
      log.info('[App] Sin conexión, operaciones se encolarán')
      // F5-05: notificar al usuario
      notificationService.warning(
        'Trabajando sin conexión. Los cambios se sincronizarán automáticamente al volver internet.',
        { titulo: 'Modo offline activado', duracion: 5000 }
      )
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Procesar cola al iniciar si está online
    if (navigator.onLine) {
      operationQueue.processQueue()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
}
