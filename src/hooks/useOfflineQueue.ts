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
import { procesarColaPacientes } from '../modules/pacientes/services/pacientesStorageService'
import { procesarColaSubidas } from '../services/adjuntosStorageService'
import { procesarColaEvoluciones } from '../modules/pacientes/services/evolucionesStorageService'
import { procesarColaPagos } from '../modules/pagos/services/pagosStorageService'
import {
  procesarColaPresupuestos,
  procesarPendingDeletesPresupuestos
} from '../domains/billing/budget/services/presupuestosStorageService'
import { notificationService } from '../services/notificationService'
import { createLogger } from '../services/logger'

const log = createLogger('useOfflineQueue')

export const useOfflineQueue = (): void => {
  useEffect(() => {
    const procesarTodasLasColas = (tipo: 'restaurada' | 'inicial'): void => {
      const prefijo = tipo === 'restaurada' ? 'pendientes' : 'iniciales'
      procesarColaPacientes().catch((e: unknown) => log.warn(`[App] Error procesando pacientes ${prefijo}:`, e))
      procesarColaSubidas().catch((e: unknown) => log.warn(`[App] Error procesando subidas ${prefijo}:`, e))
      procesarColaEvoluciones().catch((e: unknown) => log.warn(`[App] Error procesando evoluciones ${prefijo}:`, e))
      procesarColaPagos().catch((e: unknown) => log.warn(`[App] Error procesando pagos ${prefijo}:`, e))
      procesarColaPresupuestos().catch((e: unknown) => log.warn(`[App] Error procesando presupuestos ${prefijo}:`, e))
      procesarPendingDeletesPresupuestos().catch((e: unknown) => log.warn(`[App] Error procesando deletes de presupuestos:`, e))
    }

    const handleOnline = (): void => {
      log.info('[App] Conexión restaurada, procesando colas offline...')
      procesarTodasLasColas('restaurada')
    }

    const handleOffline = (): void => {
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
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      procesarTodasLasColas('inicial')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
}
