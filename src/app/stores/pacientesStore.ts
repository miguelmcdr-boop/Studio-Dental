import { create } from 'zustand'
import { pacientesStorageService, type Paciente } from '../../domains/clinical/patient'
import { createLogger } from '../../infrastructure/logging/logger'

const log = createLogger('pacientesStore')

const SEED_PACIENTES_DEMO: Paciente[] = [
  { id: 1, nombre: 'Camila Silva Morales', rut: '18.452.123-K', telefono: '+56 9 8765 4321', edad: 28, prevision: 'Isapre', alergias: 'Penicilina', email: 'camila.silva@gmail.com', ocupacion: 'Diseñadora' },
  { id: 2, nombre: 'Carlos Mendoza Vera', rut: '15.321.987-4', telefono: '+56 9 1234 5678', edad: 42, prevision: 'Fonasa', alergias: 'Ninguna', email: 'carlos.mendoza@gmail.com', ocupacion: 'Ingeniero' }
]

export type PacientesUpdater = Paciente[] | ((prev: Paciente[]) => Paciente[])

export interface PacientesStore {
  pacientes: Paciente[]
  setPacientes: (updater: PacientesUpdater) => void
  refrescarDesdeSupabase: () => Promise<void>
}

/**
 * Store global de pacientes (F2-01 — MASTER_ROADMAP).
 * Única fuente de verdad en memoria del listado de pacientes; persiste
 * automáticamente en cada `setPacientes` vía `pacientesStorageService`.
 *
 * F4-02c-2: el storage service maneja la caché internamente (síncrona para
 * lectura, async para escritura). El store simplemente delega.
 *
 * F5-02: método refrescarDesdeSupabase() para sincronización en tiempo real.
 * Lee datos frescos desde Supabase sin escribir (evita loop de sincronización).
 */
export const usePacientesStore = create<PacientesStore>((set) => ({
  pacientes: pacientesStorageService.obtenerPacientes(SEED_PACIENTES_DEMO),

  setPacientes: (updater: PacientesUpdater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.pacientes) : updater
    // guardarPacientes retorna Promise en modo Supabase, pero no necesitamos
    // esperar: la caché ya se actualizó síncronamente dentro del servicio.
    pacientesStorageService.guardarPacientes(next)
    return { pacientes: next }
  }),

  /**
   * F5-02 / F6-C-d.4: Refresca pacientes desde Supabase SIN escribir de vuelta.
   * Usado por useRealtimeSync cuando detecta cambios desde otros dispositivos
   * y al iniciar sesión (criterio #4 del roadmap: miembros de la misma clínica
   * ven el mismo directorio).
   */
  refrescarDesdeSupabase: async (): Promise<void> => {
    try {
      if (typeof pacientesStorageService.procesarColaPacientes === 'function') {
        await pacientesStorageService.procesarColaPacientes().catch((e: unknown) => log.warn('Error procesando cola pacientes:', e))
      }
      const datos = await pacientesStorageService.sincronizarDesdeSupabase()
      if (Array.isArray(datos)) {
        set({ pacientes: datos })
      }
    } catch (e: unknown) {
      log.error('Error refrescarDesdeSupabase:', e)
    }
  }
}))
