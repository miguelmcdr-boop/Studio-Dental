import { create } from 'zustand'
import { pacientesStorageService } from '../modules/pacientes'

const SEED_PACIENTES_DEMO = [
  { id: 1, nombre: 'Camila Silva Morales', rut: '18.452.123-K', telefono: '+56 9 8765 4321', edad: 28, prevision: 'Isapre', alergias: 'Penicilina', email: 'camila.silva@gmail.com', ocupacion: 'Diseñadora' },
  { id: 2, nombre: 'Carlos Mendoza Vera', rut: '15.321.987-4', telefono: '+56 9 1234 5678', edad: 42, prevision: 'Fonasa', alergias: 'Ninguna', email: 'carlos.mendoza@gmail.com', ocupacion: 'Ingeniero' }
]

/**
 * Store global de pacientes (F2-01 — MASTER_ROADMAP).
 * Única fuente de verdad en memoria del listado de pacientes; persiste
 * automáticamente en cada `setPacientes` vía `pacientesStorageService`
 * (que a su vez usa el repositorio genérico de F2-03).
 */
export const usePacientesStore = create((set) => ({
  pacientes: pacientesStorageService.obtenerPacientes(SEED_PACIENTES_DEMO),

  // Misma firma que useState: acepta un array nuevo o una función updater
  // (prev) => nuevoArray, para no romper ningún llamador existente.
  setPacientes: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.pacientes) : updater
    pacientesStorageService.guardarPacientes(next)
    return { pacientes: next }
  })
}))