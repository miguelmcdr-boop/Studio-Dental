/**
 * Funciones de formato y normalización de RUT chileno (F6-G)
 * Extraídas de validarRut.js para respetar límite arquitectónico de 50 líneas.
 */

/**
 * Normaliza un RUT: quita puntos, guiones y convierte K a mayúscula
 */
export const normalizarRut = (rut) => {
  if (!rut || typeof rut !== 'string') return ''
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim()
}

/**
 * Formatea un RUT con puntos y guión para display (XX.XXX.XXX-X)
 */
export const formatearRut = (rut) => {
  const normalizado = normalizarRut(rut)
  if (normalizado.length < 2) return rut
  const cuerpo = normalizado.slice(0, -1)
  const dv = normalizado.slice(-1)
  let formateado = ''
  for (let i = cuerpo.length - 1, j = 1; i >= 0; i--, j++) {
    formateado = cuerpo[i] + formateado
    if (j % 3 === 0 && i > 0) formateado = '.' + formateado
  }
  return `${formateado}-${dv}`
}
