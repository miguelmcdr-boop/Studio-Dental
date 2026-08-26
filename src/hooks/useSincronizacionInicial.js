import { useEffect } from 'react'
import { agendaStorageService } from '../modules/agenda/services/agendaStorageService'
import { presupuestosStorageService } from '../modules/presupuestos/services/presupuestosStorageService'
import { pagosStorageService } from '../modules/pagos/services/pagosStorageService'
import { finanzasStorageService } from '../modules/finanzas/services/finanzasStorageService'
import { createLogger } from '../services/logger.js'

const log = createLogger('useSincronizacionInicial')

/**
 * Hook de sincronización inicial post-login (F6-C-d.4).
 * Refresca las 4 tablas sin store Zustand desde Supabase al montar.
 * Pacientes se sincroniza en useDataMigration (evita race condition).
 *
 * @param {boolean} enabled - Si es false, no sincroniza
 */
export const useSincronizacionInicial = (enabled) => {
  useEffect(() => {
    if (!enabled) return

    const sincronizarInicial = async () => {
      const servicios = [
        ['citas', agendaStorageService],
        ['presupuestos', presupuestosStorageService],
        ['pagos', pagosStorageService],
        ['movimientos_financieros', finanzasStorageService],
      ]

      for (const [nombre, servicio] of servicios) {
        try {
          if (typeof servicio.sincronizarDesdeSupabase === 'function') {
            await servicio.sincronizarDesdeSupabase()
            log.info(`[useRealtimeSync] Sincronización inicial de ${nombre}: OK`)
          }
        } catch (e) {
          log.warn(`[useRealtimeSync] Error sincronizando ${nombre}:`, e.message)
        }
      }
    }

    sincronizarInicial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}
