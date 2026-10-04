/**
 * Módulo de Validaciones y Sanitización para Cirugía, Implantología y Endodoncia
 */

export const sanitizarTorque = (valor: unknown): number | null => {
  if (valor === '' || valor === null || valor === undefined) return null
  const num = parseInt(String(valor), 10)
  if (isNaN(num)) return null
  return Math.max(0, Math.min(100, num))
}

export const sanitizarISQ = (valor: unknown): number | null => {
  if (valor === '' || valor === null || valor === undefined) return null
  const num = parseInt(String(valor), 10)
  if (isNaN(num)) return null
  return Math.max(0, Math.min(100, num))
}

export const esPiezaValida = (pieza: unknown): boolean => {
  if (!pieza || typeof pieza !== 'string') return false
  return pieza.trim().length > 0
}

export const sanitizarLongitudConducto = (valor: unknown): string => {
  if (!valor) return ''
  return String(valor).replace(',', '.').trim()
}
