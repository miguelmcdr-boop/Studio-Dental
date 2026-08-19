import { useEffect } from 'react'
import { usePacientesStore } from '../store/pacientesStore'
import { pacientesStorageService } from '../modules/pacientes'
import { agendaStorageService } from '../modules/agenda/services/agendaStorageService'
import { presupuestosStorageService } from '../modules/presupuestos/services/presupuestosStorageService'
import { pagosStorageService } from '../modules/pagos/services/pagosStorageService'
import { finanzasStorageService } from '../modules/finanzas/services/finanzasStorageService'

/**
 * Hook de sincronización inicial post-login (F6-C-d.4).
 *
 * Al montar, refresca las 5 tablas principales desde Supabase para que
 * la caché en localStorage no muestre datos viejos a usuarios de la misma clínica.
 *
 * Extraído de useRealtimeSync.js para mantener el archivo dentro del límite
 * de 150 líneas.
 *
 * @param {boolean} enabled - Si es false, no sincroniza
 */
export const useSincronizacionInicial = (enabled) => {
  useEffect(() => {
    if (!enabled) return

    const sincronizarInicial = async () => {
      try {
        if (typeof usePacientesStore.getState().refrescarDesdeSupabase === 'function') {
          await usePacientesStore.getState().refrescarDesdeSupabase()
          console.log('[useRealtimeSync] Sincronización inicial de pacientes: OK (vía store)')
        }
      } catch (e) {
        console.warn('[useRealtimeSync] Error sincronizando pacientes:', e.message)
      }

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
            console.log(`[useRealtimeSync] Sincronización inicial de ${nombre}: OK`)
          }
        } catch (e) {
          console.warn(`[useRealtimeSync] Error sincronizando ${nombre}:`, e.message)
        }
      }
    }

    sincronizarInicial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}
