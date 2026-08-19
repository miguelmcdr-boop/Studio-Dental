/**
 * Hook central de sincronización en tiempo real (F5-02).
 *
 * Se suscribe a todas las tablas críticas de Supabase y emite eventos
 * custom o refresca stores Zustand cuando hay cambios desde otros dispositivos.
 *
 * Debe montarse UNA SOLA VEZ en el componente raíz (App.jsx).
 *
 * Características:
 * - Prevención de loops vía timestamp de escritura local (2s tolerancia)
 * - Refresca pacientesStore directamente (tiene store Zustand)
 * - Emite eventos custom para módulos sin store (agenda, presupuestos, etc.)
 * - Cleanup automático al desmontar
 * - Manejo graceful si Supabase no está configurado
 */
import { useEffect } from 'react'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { usePacientesStore } from '../store/pacientesStore'
import { useSesionStore } from '../store/sesionStore'
import { USE_SUPABASE } from '../services/supabaseClient'
import { notificationService } from '../services/notificationService'
import { TABLAS_REALTIME } from '../services/realtimeEvents'
// F6-C-d.4: storage services para sincronización inicial post-login
import { pacientesStorageService } from '../modules/pacientes'
import { agendaStorageService } from '../modules/agenda/services/agendaStorageService'
import { presupuestosStorageService } from '../modules/presupuestos/services/presupuestosStorageService'
import { pagosStorageService } from '../modules/pagos/services/pagosStorageService'
import { finanzasStorageService } from '../modules/finanzas/services/finanzasStorageService'

/**
 * Ventana de tiempo (en ms) durante la cual se ignoran eventos
 * que coincidan con una escritura local reciente. Previene loops.
 */
const TOLERANCIA_LOOP_MS = 2000

/**
 * Timestamp de la última escritura local (por tabla).
 * Shared state entre todas las instancias del hook.
 */
const ultimaEscrituraLocal = {}

/**
 * Registra que acabamos de escribir en una tabla (timestamp actual).
 * Debe llamarse manualmente desde storage services cuando escriben.
 *
 * @param {string} tabla - Nombre de la tabla
 */
export const registrarEscrituraLocal = (tabla) => {
  ultimaEscrituraLocal[tabla] = Date.now()
}

/**
 * Verifica si un evento de Realtime fue causado por nuestra propia escritura.
 *
 * @param {string} tabla - Nombre de la tabla
 * @returns {boolean} true si el evento es local (debe ignorarse)
 */
const esEventoLocal = (tabla) => {
  const timestamp = ultimaEscrituraLocal[tabla]
  if (!timestamp) return false

  const ahora = Date.now()
  return (ahora - timestamp) < TOLERANCIA_LOOP_MS
}

/**
 * Hook de sincronización en tiempo real.
 * Monta suscripciones a todas las tablas críticas.
 */
export const useRealtimeSync = () => {
  const userProfile = useSesionStore((state) => state.userProfile)
  const refrescarPacientes = usePacientesStore((state) => state.refrescarDesdeSupabase)

  // No activar si no hay usuario logueado o Supabase no está configurado
  const enabled = !!userProfile && USE_SUPABASE

  // Generar handler para cada tabla
  const crearHandler = (tabla) => (payload) => {
    // Ignorar eventos de nuestra propia escritura (prevención de loops)
    if (esEventoLocal(tabla)) {
      console.log(`[useRealtimeSync] Ignorando evento local en ${tabla}`)
      return
    }

    console.log(`[useRealtimeSync] Cambio en ${tabla}:`, payload.eventType)

    // Caso especial: pacientes (tiene store Zustand)
    if (tabla === 'pacientes') {
      refrescarPacientes()
      // F5-05: notificar al usuario del cambio externo
      notificationService.info(
        `Otro usuario modificó datos de pacientes`,
        { titulo: 'Actualización en tiempo real', duracion: 3000 }
      )
      return
    }

    // Otros casos: emitir evento custom
    const evento = TABLAS_REALTIME[tabla]
    if (evento) {
      window.dispatchEvent(new CustomEvent(evento, { detail: payload }))
    }
  }

  // Suscripciones a cada tabla crítica
  useRealtimeSubscription('pacientes', crearHandler('pacientes'), { enabled })
  useRealtimeSubscription('citas', crearHandler('citas'), { enabled })
  useRealtimeSubscription('presupuestos', crearHandler('presupuestos'), { enabled })
  useRealtimeSubscription('presupuesto_items', crearHandler('presupuesto_items'), { enabled })
  useRealtimeSubscription('pagos', crearHandler('pagos'), { enabled })
  useRealtimeSubscription('movimientos_financieros', crearHandler('movimientos_financieros'), { enabled })
  useRealtimeSubscription('evoluciones_clinicas', crearHandler('evoluciones_clinicas'), { enabled })
  useRealtimeSubscription('recetas', crearHandler('recetas'), { enabled })
  useRealtimeSubscription('odontogramas', crearHandler('odontogramas'), { enabled })
  useRealtimeSubscription('periodontogramas', crearHandler('periodontogramas'), { enabled })
  useRealtimeSubscription('inventario', crearHandler('inventario'), { enabled })

  // F6-C-d.4: sincronización inicial post-login (criterio #4 del roadmap:
  // "cuatro usuarios con roles distintos en la misma clínica ven el mismo directorio")
  // Al montar, refrescar las 5 tablas principales desde Supabase para que la caché
  // en localStorage no muestre datos viejos a usuarios de la misma clínica.
  useEffect(() => {
    if (!enabled) return
    
    const sincronizarInicial = async () => {
      // F6-C-d.4: sincronización inicial de módulos sin store Zustand.
      // Pacientes NO se sincroniza aquí porque useDataMigration ya lo hace
      // (evita race condition donde ambos hooks sobrescriben el store).
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

  // Log de activación (solo en desarrollo)
  useEffect(() => {
    if (enabled) {
      console.log('[useRealtimeSync] Sincronización en tiempo real activada')
    }
  }, [enabled])
}

