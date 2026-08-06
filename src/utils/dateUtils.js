/**
 * Devuelve la fecha en formato YYYY-MM-DD usando la hora LOCAL del navegador
 * (no UTC), para evitar el desfase de zona horaria de toISOString().
 */
export const obtenerFechaLocalISO = (fecha = new Date()) => {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}