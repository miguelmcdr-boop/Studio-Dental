/**
 * Constantes de UI para calculadora de anestesia (F7-01).
 *
 * Configuración visual por estado del cálculo.
 */

export const CONFIG_ESTADO = {
  OK: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    label: 'Límite de Seguridad Recomendado'
  },
  DATOS_INCOMPLETOS: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-800',
    label: '⚠ Verificación Manual Requerida'
  },
  ANESTESICO_DESCONOCIDO: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-800',
    label: '⚠ Anestésico No Reconocido'
  }
}
