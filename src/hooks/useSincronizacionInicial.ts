import { useEffect } from 'react'
import { agendaStorageService } from '../domains/operations/agenda/services/agendaStorageService'
import { presupuestosStorageService } from '../domains/billing/budget/services/presupuestosStorageService'
import { pagosStorageService } from '../domains/billing/payment/services/pagosStorageService'
import { finanzasStorageService } from '../domains/billing/cash-register/services/finanzasStorageService'
import { vademecumService } from '../services/vademecumService'
import { escanearYSincronizarAdjuntosPendientes } from '../services/adjuntosStorageService'
import { createLogger } from '../services/logger'

const log = createLogger('useSincronizacionInicial')

interface SincronizableService {
  sincronizarDesdeSupabase?: () => Promise<unknown>
}

/**
 * Hook de sincronización inicial post-login (F6-C-d.4).
 * Refresca las 4 tablas sin store Zustand desde Supabase al montar.
 * Pacientes se sincroniza en useDataMigration (evita race condition).
 * P0-2: Escanea IndexedDB y sube adjuntos pendientes a Supabase Storage.
 *
 * @param enabled - Si es false, no sincroniza
 */
export const useSincronizacionInicial = (enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) return

    const sincronizarInicial = async (): Promise<void> => {
      const servicios: [string, SincronizableService][] = [
        ['citas', agendaStorageService],
        ['presupuestos', presupuestosStorageService],
        ['pagos', pagosStorageService],
        ['movimientos_financieros', finanzasStorageService],
        ['vademecum', vademecumService],
      ]

      for (const [nombre, servicio] of servicios) {
        try {
          if (typeof servicio.sincronizarDesdeSupabase === 'function') {
            await servicio.sincronizarDesdeSupabase()
            log.info(`[useRealtimeSync] Sincronización inicial de ${nombre}: OK`)
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          log.warn(`[useRealtimeSync] Error sincronizando ${nombre}:`, msg)
        }
      }

      // P0-2: Escanear y subir adjuntos pendientes en IndexedDB
      try {
        await escanearYSincronizarAdjuntosPendientes()
        log.info('[useRealtimeSync] Sincronización inicial de adjuntos: OK')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log.warn('[useRealtimeSync] Error sincronizando adjuntos:', msg)
      }
    }

    void sincronizarInicial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}
