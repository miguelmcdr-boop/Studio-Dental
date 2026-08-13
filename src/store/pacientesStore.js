import { create } from 'zustand'
import { pacientesStorageService } from '../modules/pacientes'

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
 */
export const usePacientesStore = create((set) => ({
  pacientes: pacientesStorageService.obtenerPacientes(SEED_PACIENTES_DEMO),

  setPacientes: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.pacientes) : updater
    // guardarPacientes retorna Promise en modo Supabase, pero no necesitamos
    // esperar: la caché ya se actualizó síncronamente dentro del servicio.
    pacientesStorageService.guardarPacientes(next)
    return { pacientes: next }
  })
}))
