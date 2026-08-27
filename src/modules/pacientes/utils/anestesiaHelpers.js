/**
 * Helpers para cálculos de anestesia (F7-01).
 *
 * Funciones puras de derivación de flags clínicos desde datos del paciente.
 */

/**
 * Detecta si el paciente tiene cardiopatía basado en el campo de enfermedades.
 * Busca términos cardiovasculares comunes en español.
 */
export const esCardiopata = (enfermedades) => {
  if (!enfermedades) return false
  const texto = String(enfermedades).toLowerCase()
  return /cardio|hipertens|hiperten|infarto|angina|insuficien|arritmia/.test(texto)
}

/**
 * Detecta si el paciente es pediátrico (menor de 18 años).
 */
export const esPediatria = (edad) => {
  const edadNum = parseInt(edad)
  return Number.isFinite(edadNum) && edadNum < 18
}

/**
 * Parsea edad a número entero, retornando null si no es válida.
 */
export const parseEdad = (edad) => {
  if (edad === null || edad === undefined || edad === '') return null
  const num = parseInt(edad)
  return Number.isFinite(num) ? num : null
}
