/**
 * Validación de RUT chileno con módulo 11 (F6-G)
 */
import { normalizarRut } from './validarRutFormato'

// Re-export para compatibilidad con consumers existentes
export { normalizarRut, formatearRut } from './validarRutFormato'

/**
 * Valida un RUT usando el algoritmo de módulo 11 chileno
 */
export const validarRut = (rut) => {
  const n = normalizarRut(rut)
  if (n.length < 8) return false
  const cuerpo = n.slice(0, -1)
  const dv = n.slice(-1)
  if (!/^\d+$/.test(cuerpo)) return false
  let suma = 0
  let mult = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const resto = 11 - (suma % 11)
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : resto.toString()
  return dv === dvEsperado
}

/**
 * Valida y retorna mensaje de error si el RUT es inválido
 */
export const obtenerErrorRut = (rut) => {
  if (!rut || rut.trim() === '') return null
  const n = normalizarRut(rut)
  if (n.length < 8) return 'RUT demasiado corto'
  if (!validarRut(n)) return 'RUT inválido (verifique el dígito verificador)'
  return null
}
