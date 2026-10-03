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
 */
import { useCallback } from 'react'
import { useDialogStore } from '../store/dialogStore'

export type DialogVariant = 'info' | 'warning' | 'danger' | 'success' | 'error'

export interface ConfirmDialogConfig {
  title: string
  description?: string
  variant?: 'info' | 'warning' | 'danger'
  confirmText?: string
  cancelText?: string
}

export interface AlertDialogConfig {
  title: string
  description?: string
  variant?: DialogVariant
  confirmText?: string
}

export interface UseAppDialogReturn {
  confirm: (config: ConfirmDialogConfig) => Promise<boolean>
  alert: (config: AlertDialogConfig) => Promise<void>
}

interface DialogStoreState {
  openDialog: (config: Record<string, unknown>) => Promise<unknown>
}

export const useAppDialog = (): UseAppDialogReturn => {
  const openDialog = useDialogStore((state: unknown) => (state as DialogStoreState).openDialog)

  /**
   * Muestra un diálogo de confirmación (similar a window.confirm pero con UI del DS).
   */
  const confirm = useCallback(
    ({
      title,
      description,
      variant = 'warning',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
    }: ConfirmDialogConfig): Promise<boolean> => {
      return openDialog({
        type: 'confirm',
        title,
        description,
        variant,
        confirmText,
        cancelText,
      }) as Promise<boolean>
    },
    [openDialog]
  )

  /**
   * Muestra un diálogo de alerta (similar a window.alert pero con UI del DS).
   */
  const alert = useCallback(
    ({
      title,
      description,
      variant = 'info',
      confirmText = 'Entendido',
    }: AlertDialogConfig): Promise<void> => {
      return openDialog({
        type: 'alert',
        title,
        description,
        variant,
        confirmText,
      }) as Promise<void>
    },
    [openDialog]
  )

  return { confirm, alert }
}
