/**
 * Utilidades puras para la gestión de folios y constancias GES
 */

export const generarFolioGes = () => {
  const anio = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `GES-${anio}-${random}`
}

export const formatearFechaHoraChile = () => {
  const ahora = new Date()
  const fecha = ahora.toLocaleDateString('es-CL')
  const hora = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  return `${fecha} a las ${hora} hrs.`
}