import { create } from 'zustand'
import { prestacionesStorageService } from '../domains/organization/prestations/services/prestacionesStorageService'
import { ARANCEL_DEFAULT } from '../domains/organization/prestations/constants/prestacionesConstants'
import type { Prestacion } from '../domains/organization/prestations/schemas/prestacionSchema'

const defaultPrestaciones: Prestacion[] = ARANCEL_DEFAULT.map((item) => ({
  id: item.id,
  nombre: item.nombre,
  especialidad: item.especialidad,
  precioParticular: item.precioParticular,
  precioFonasa: item.precioFonasa,
  codigoFonasa: item.codigoFonasa,
}))

const normalizar = (lista: Prestacion[]): Prestacion[] =>
  lista.map((p) => ({
    ...p,
    precio: parseFloat(String(p.precio ?? p.precioParticular)) || 0,
    precioParticular: parseFloat(String(p.precioParticular ?? p.precio)) || 0,
  }))

export type PrestacionesUpdater = Prestacion[] | ((prev: Prestacion[]) => Prestacion[])

export interface PrestacionesStore {
  prestacionesArancel: Prestacion[]
  prestaciones?: Prestacion[]
  setPrestacionesArancel: (updater: PrestacionesUpdater) => void
  refrescarDesdeStorage: () => void
}

/**
 * Store global del arancel de prestaciones (F2-01 — MASTER_ROADMAP).
 * Sustituye el useState + 2 useEffect (persistencia + listener cross-módulo)
 * que vivían en App.jsx.
 */
export const usePrestacionesStore = create<PrestacionesStore>((set) => ({
  prestacionesArancel: normalizar(prestacionesStorageService.obtenerPrestaciones(defaultPrestaciones) ?? defaultPrestaciones),

  // Misma firma que useState: acepta un array nuevo o una función updater.
  setPrestacionesArancel: (updater: PrestacionesUpdater) =>
    set((state) => {
      const next = typeof updater === 'function' ? updater(state.prestacionesArancel) : updater
      const normalizado = normalizar(next)
      prestacionesStorageService.guardarPrestaciones(normalizado)
      return { prestacionesArancel: normalizado }
    }),

  // Re-lee desde localStorage sin volver a escribir (usado por el listener
  // de 'storage'/'arancel_actualizado' — evita loop de escritura).
  refrescarDesdeStorage: () =>
    set(() => {
      const datos = prestacionesStorageService.obtenerPrestaciones(undefined)
      if (!Array.isArray(datos)) return {}
      return { prestacionesArancel: normalizar(datos) }
    }),
}))
