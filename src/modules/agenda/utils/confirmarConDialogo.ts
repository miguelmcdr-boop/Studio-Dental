/**
 * confirmarConDialogo — Helper compartido para diálogos de confirmación
 */

export interface DialogOptions {
  title: string
  description: string
  variant?: string
  confirmText?: string
  cancelText?: string
}

export type ConfirmDialogFn = (options: DialogOptions) => Promise<boolean>

export const confirmarConDialogo = async (
  mensaje: string,
  confirmFn: ConfirmDialogFn | null = null
): Promise<boolean> => {
  if (confirmFn) {
    return await confirmFn({
      title: 'Conflicto de horario',
      description: mensaje,
      variant: 'warning',
      confirmText: 'Continuar de todos modos',
      cancelText: 'Revisar cita'
    })
  }
  return window.confirm(mensaje)
}
