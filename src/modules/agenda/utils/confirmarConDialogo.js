/**
 * confirmarConDialogo — Helper compartido para diálogos de confirmación
 * 
 * Encapsula la lógica de diálogo de confirmación (título, variant, botones)
 * con fallback a window.confirm cuando no hay confirmFn disponible.
 * 
 * @param {string} mensaje - Mensaje a mostrar
 * @param {Function|null} confirmFn - Función confirm de useAppDialog (opcional)
 * @returns {Promise<boolean>} - true si confirmó, false si canceló
 */
export const confirmarConDialogo = async (mensaje, confirmFn = null) => {
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
