import { create } from 'zustand'
import { prestacionesStorageService, ARANCEL_DEFAULT } from '../modules/prestaciones'

const normalizar = (lista) => lista.map(p => ({
  ...p,
  precio: parseFloat(p.precio ?? p.precioParticular) || 0,
  precioParticular: parseFloat(p.precioParticular ?? p.precio) || 0
}))

/**
 * Store global del arancel de prestaciones (F2-01 — MASTER_ROADMAP).
 * Sustituye el useState + 2 useEffect (persistencia + listener cross-módulo)
 * que vivían en App.jsx.
 */
export const usePrestacionesStore = create((set) => ({
  prestacionesArancel: normalizar(prestacionesStorageService.obtenerPrestaciones(ARANCEL_DEFAULT)),

  // Misma firma que useState: acepta un array nuevo o una función updater.
  setPrestacionesArancel: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.prestacionesArancel) : updater
    const normalizado = normalizar(next)
    prestacionesStorageService.guardarPrestaciones(normalizado)
    return { prestacionesArancel: normalizado }
  }),

  // Re-lee desde localStorage sin volver a escribir (usado por el listener
  // de 'storage'/'arancel_actualizado' — evita loop de escritura).
  refrescarDesdeStorage: () => set(() => {
    const datos = prestacionesStorageService.obtenerPrestaciones(null)
    if (!Array.isArray(datos)) return {}
    return { prestacionesArancel: normalizar(datos) }
  })
}))