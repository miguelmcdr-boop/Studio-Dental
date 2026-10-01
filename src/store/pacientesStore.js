import { create } from 'zustand'
import { pacientesStorageService } from '../modules/pacientes'
import { createLogger } from '../services/logger.js'

const log = createLogger('pacientesStore')

const SEED_PACIENTES_DEMO = [
  { id: 1, nombre: 'Camila Silva Morales', rut: '18.452.123-K', telefono: '+56 9 8765 4321', edad: 28, prevision: 'Isapre', alergias:'Penicilina', email: 'camila.silva@gmail.com', ocupacion: 'Diseñadora' },
  { id: 2, nombre: 'Carlos Mendoza Vera', rut: '15.321.987-4', telefono: '+56 9 1234 5678', edad: 42, prevision: 'Fonasa', alergias: 'Ninguna', email: 'carlos.mendoza@gmail.com', ocupacion: 'Ingeniero' }
]

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
export const usePacientesStore = create((set) => ({
  pacientes: pacientesStorageService.obtenerPacientes(SEED_PACIENTES_DEMO),

  setPacientes: (updater) => set((state) => {
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
   *
   * Pre-F6-C-d.4 este método leía la caché en lugar de Supabase, lo que
   * impedía que usuarios de la misma clínica vieran los datos del otro.
   */
  refrescarDesdeSupabase: async () => {
    try {
      const datos = await pacientesStorageService.sincronizarDesdeSupabase()
      if (Array.isArray(datos)) {
        set({ pacientes: datos })
      }
    } catch (e) {
      log.error('Error refrescarDesdeSupabase:', e)
    }
  }
}))
