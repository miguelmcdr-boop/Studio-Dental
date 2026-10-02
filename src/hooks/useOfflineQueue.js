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
import { procesarColaPresupuestos, procesarPendingDeletesPresupuestos } from '../modules/presupuestos/services/presupuestosStorageService'
import { notificationService } from '../services/notificationService'
import { createLogger } from '../services/logger'

const log = createLogger('useOfflineQueue')

export const useOfflineQueue = () => {
  useEffect(() => {
    const handleOnline = () => {
      log.info('[App] Conexión restaurada, procesando colas offline...')
      procesarColaPacientes().catch((e) => log.warn('[App] Error procesando pacientes pendientes:', e))
      procesarColaSubidas().catch((e) => log.warn('[App] Error procesando subidas:', e))
      procesarColaEvoluciones().catch((e) => log.warn('[App] Error procesando evoluciones pendientes:', e))
      procesarColaPagos().catch((e) => log.warn('[App] Error procesando pagos pendientes:', e))
      procesarColaPresupuestos().catch((e) => log.warn('[App] Error procesando presupuestos pendientes:', e))
      procesarPendingDeletesPresupuestos().catch((e) => log.warn('[App] Error procesando deletes de presupuestos:', e))
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
      procesarColaPacientes().catch((e) => log.warn('[App] Error procesando pacientes iniciales:', e))
      procesarColaSubidas().catch((e) => log.warn('[App] Error procesando subidas iniciales:', e))
      procesarColaEvoluciones().catch((e) => log.warn('[App] Error procesando evoluciones iniciales:', e))
      procesarColaPagos().catch((e) => log.warn('[App] Error procesando pagos iniciales:', e))
      procesarColaPresupuestos().catch((e) => log.warn('[App] Error procesando presupuestos iniciales:', e))
      procesarPendingDeletesPresupuestos().catch((e) => log.warn('[App] Error procesando deletes iniciales de presupuestos:', e))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
}
