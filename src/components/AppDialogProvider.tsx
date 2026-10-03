/**
 * AppDialogProvider — Provider global de diálogos (F10-C3.1)
 *
 * Escucha al dialogStore y renderiza <ConfirmDialog> cuando hay un diálogo abierto.
 * Debe montarse una sola vez en el root de la aplicación (App.jsx).
 *
 * Maneja automáticamente:
 *   - Apertura/cierre del diálogo según estado del store
 *   - Resolución de la Promise con true/false/void según la acción del usuario
 *   - Cierre con ESC y click en overlay (vía Modal base)
 */
import React from 'react'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { useDialogStore } from '../store/dialogStore'

interface DialogState {
  type: 'confirm' | 'alert'
  title: string
  description?: string
  variant?: 'info' | 'warning' | 'danger'
  confirmText?: string
  cancelText?: string
}

export const AppDialogProvider: React.FC = () => {
  const dialog = useDialogStore((state: unknown) => (state as { dialog: DialogState | null }).dialog)
  const closeDialog = useDialogStore((state: unknown) => (state as { closeDialog: (result: unknown) => void }).closeDialog)

  if (!dialog) return null

  const handleConfirm = (): void => {
    if (dialog.type === 'confirm') {
      closeDialog(true)
    } else {
      // alert: se resuelve con undefined
      closeDialog(undefined)
    }
  }

  const handleCancel = (): void => {
    // confirm: false. alert: nunca debería llegar aquí (no tiene botón cancelar)
    closeDialog(dialog.type === 'confirm' ? false : undefined)
  }

  // Para alert, no mostramos botón de cancelar
  const isAlert = dialog.type === 'alert'

  return (
    <ConfirmDialog
      isOpen={true}
      title={dialog.title}
      description={dialog.description}
      variant={dialog.variant || 'warning'}
      confirmText={dialog.confirmText}
      cancelText={isAlert ? null : (dialog.cancelText || 'Cancelar')}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )
}

AppDialogProvider.displayName = 'AppDialogProvider'
