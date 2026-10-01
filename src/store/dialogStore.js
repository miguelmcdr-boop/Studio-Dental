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
import { createLogger } from '../services/logger'

const log = createLogger('dialogStore')

let dialogIdCounter = 0

export const useDialogStore = create((set, get) => ({
  // Estado: diálogo abierto actualmente (o null)
  dialog: null,

  /**
   * Abre un diálogo y devuelve una Promise que se resuelve cuando el usuario confirma o cancela.
   * @param {Object} config - Configuración del diálogo
   * @param {'confirm'|'alert'} config.type - Tipo de diálogo
   * @param {string} config.title - Título del diálogo
   * @param {string} config.description - Descripción del diálogo
   * @param {'info'|'warning'|'danger'|'success'|'error'} config.variant - Variante visual
   * @param {string} config.confirmText - Texto del botón confirmar
   * @param {string} [config.cancelText] - Texto del botón cancelar (solo para confirm)
   * @returns {Promise<boolean|void>} - true si confirmó, false si canceló, void para alert
   */
  openDialog: (config) => {
    return new Promise((resolve) => {
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
   * @param {any} result - Valor con el que se resuelve la Promise
   */
  closeDialog: (result) => {
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
