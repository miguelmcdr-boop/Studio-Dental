/**
 * Módulo de Validaciones y Sanitización para Cirugía, Implantología y Endodoncia
 */

// Sanitiza el valor del Torque de Inserción (Ncm)
export const sanitizarTorque = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return 0
  const num = parseInt(valor, 10)
  if (isNaN(num)) return 0
  return Math.max(0, Math.min(100, num))
}

// Sanitiza la medición de Estabilidad Ósea ISQ (Osstell)
export const sanitizarISQ = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return 0
  const num = parseInt(valor, 10)
  if (isNaN(num)) return 0
  return Math.max(0, Math.min(100, num))
}

// Valida que el nombre de la pieza dentaria no esté vacío
export const esPiezaValida = (pieza) => {
  if (!pieza || typeof pieza !== 'string') return false
  return pieza.trim().length > 0
}

// Formatea mediciones en milímetros de conductometría
export const sanitizarLongitudConducto = (valor) => {
  if (!valor) return ''
  const limpio = String(valor).replace(',', '.').trim()
  return limpio
}