/**
 * useAppDialog — Hook público para diálogos globales (F10-C3.1)
 *
 * Reemplazo moderno de window.alert() y window.confirm() usando
 * <ConfirmDialog> del Design System v2.
 *
 * Uso:
 *   const { confirm, alert } = useAppDialog()
 *
 *   const ok = await confirm({
 *     title: 'Eliminar paciente',
 *     description: 'El paciente pasará a la papelera.',
 *     variant: 'danger',
 *     confirmText: 'Eliminar'
 *   })
 *
 *   await alert({
 *     title: 'Éxito',
 *     description: 'El paciente se eliminó correctamente.',
 *     variant: 'success',
 *     confirmText: 'Entendido'
 *   })
 *
 * Variantes soportadas:
 *   - 'info': azul clínico (confirmaciones informativas)
 *   - 'warning': ámbar clínico (acciones reversibles con cuidado)
 *   - 'danger': rojo clínico (acciones destructivas)
 *   - 'success': verde clínico (mensajes de éxito)
 *   - 'error': rojo clínico (errores)
 */
import { useCallback } from 'react'
import { useDialogStore } from '../store/dialogStore'

export const useAppDialog = () => {
  const openDialog = useDialogStore((state) => state.openDialog)

  /**
   * Muestra un diálogo de confirmación (similar a window.confirm pero con UI del DS).
   * @param {Object} config
   * @param {string} config.title - Título del diálogo
   * @param {string} [config.description] - Descripción opcional
   * @param {'info'|'warning'|'danger'} [config.variant='warning'] - Variante visual
   * @param {string} [config.confirmText='Confirmar'] - Texto del botón confirmar
   * @param {string} [config.cancelText='Cancelar'] - Texto del botón cancelar
   * @returns {Promise<boolean>} - true si confirmó, false si canceló (o cerró con ESC/overlay)
   */
  const confirm = useCallback(
    ({
      title,
      description,
      variant = 'warning',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
    }) => {
      return openDialog({
        type: 'confirm',
        title,
        description,
        variant,
        confirmText,
        cancelText,
      })
    },
    [openDialog]
  )

  /**
   * Muestra un diálogo de alerta (similar a window.alert pero con UI del DS).
   * @param {Object} config
   * @param {string} config.title - Título del diálogo
   * @param {string} [config.description] - Descripción opcional
   * @param {'info'|'warning'|'danger'|'success'|'error'} [config.variant='info'] - Variante visual
   * @param {string} [config.confirmText='Entendido'] - Texto del botón
   * @returns {Promise<void>} - Se resuelve cuando el usuario cierra
   */
  const alert = useCallback(
    ({
      title,
      description,
      variant = 'info',
      confirmText = 'Entendido',
    }) => {
      return openDialog({
        type: 'alert',
        title,
        description,
        variant,
        confirmText,
      })
    },
    [openDialog]
  )

  return { confirm, alert }
}
