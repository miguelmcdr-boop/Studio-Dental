/**
 * dialogStore — Store Zustand para diálogos globales (F10-C3.1)
 *
 * Almacena el estado del diálogo abierto (si lo hay) y expone
 * acciones para abrir/cerrar diálogos con resolución vía Promise.
 *
 * Uso:
 *   const openDialog = useDialogStore(state => state.openDialog)
 *   const result = await openDialog({
 *     type: 'confirm',
 *     title: '¿Eliminar?',
 *     description: 'Esta acción no se puede deshacer',
 *     variant: 'danger',
 *     confirmText: 'Eliminar',
 *     cancelText: 'Cancelar'
 *   })
 *   if (result) { (usuario confirmó) }
 */
import { create } from 'zustand'
import { createLogger } from '../infrastructure/logging/logger'

const log = createLogger('dialogStore')

let dialogIdCounter = 0

export type DialogType = 'confirm' | 'alert'
export type DialogVariant = 'info' | 'warning' | 'danger' | 'success' | 'error'

export interface DialogConfig {
  type: DialogType
  title: string
  description?: string
  variant?: DialogVariant
  confirmText?: string
  cancelText?: string
  [key: string]: unknown
}

export interface DialogActive extends DialogConfig {
  id: number
  resolve: (value: boolean | void) => void
}

export interface DialogStore {
  dialog: DialogActive | null
  openDialog: (config: DialogConfig) => Promise<boolean | void>
  closeDialog: (result?: boolean | void) => void
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  // Estado: diálogo abierto actualmente (o null)
  dialog: null,

  /**
   * Abre un diálogo y devuelve una Promise que se resuelve cuando el usuario confirma o cancela.
   */
  openDialog: (config: DialogConfig): Promise<boolean | void> => {
    return new Promise<boolean | void>((resolve) => {
      const id = ++dialogIdCounter
      log.debug('Abriendo diálogo', { id, type: config.type, title: config.title })
      set({
        dialog: {
          id,
          ...config,
          resolve,
        },
      })
    })
  },

  /**
   * Cierra el diálogo actual resolviendo la Promise con el valor dado.
   */
  closeDialog: (result?: boolean | void): void => {
    const { dialog } = get()
    if (!dialog) {
      log.warn('Intento de cerrar diálogo cuando no hay ninguno abierto')
      return
    }
    log.debug('Cerrando diálogo', { id: dialog.id, result })
    dialog.resolve(result)
    set({ dialog: null })
  },
}))
