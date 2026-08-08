/**
 * Módulo de Validaciones y Sanitización para Cirugía, Implantología y Endodoncia
 */

/**
 * Sanitiza el valor del Torque de Inserción (Ncm) de un implante dental.
 *
 * REGLA DE SEGURIDAD CLÍNICA (Constitución, Cap. V.2 — "Fail-Safe Clinical
 * Default"): el torque de inserción tiene significado diagnóstico real —
 * un valor de 0 Ncm indica inestabilidad primaria total del implante, un
 * hallazgo clínicamente grave. Si el campo no fue informado, la función
 * NUNCA debe retornar 0 (que se confundiría con esa medición real);
 * retorna `null` para que la UI muestre "No registrado" en vez de "0 Ncm".
 */
export const sanitizarTorque = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return null
  const num = parseInt(valor, 10)
  if (isNaN(num)) return null
  return Math.max(0, Math.min(100, num))
}

/**
 * Sanitiza la medición de Estabilidad Ósea ISQ (Osstell) de un implante.
 * Misma regla que sanitizarTorque: un ISQ de 0 es un hallazgo real y grave
 * (inestabilidad ósea), no debe confundirse con "no medido".
 */
export const sanitizarISQ = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return null
  const num = parseInt(valor, 10)
  if (isNaN(num)) return null
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