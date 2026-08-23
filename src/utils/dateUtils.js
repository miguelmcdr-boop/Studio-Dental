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
/**
 * Formatea una fecha como tiempo relativo ("hace X días/horas/minutos").
 * Útil para mostrar cuándo se eliminó un paciente en la papelera.
 * 
 * @param {string|Date} fecha - Fecha a formatear (ISO string o Date)
 * @returns {string} Texto relativo (ej: "hace 2 días", "hace 3 horas")
 */
export const tiempoRelativo = (fecha) => {
  const ahora = new Date()
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha
  
  if (!fechaObj || isNaN(fechaObj.getTime())) {
    return 'Fecha desconocida'
  }
  
  const diffMs = ahora - fechaObj
  const diffSegundos = Math.floor(diffMs / 1000)
  const diffMinutos = Math.floor(diffSegundos / 60)
  const diffHoras = Math.floor(diffMinutos / 60)
  const diffDias = Math.floor(diffHoras / 24)
  const diffSemanas = Math.floor(diffDias / 7)
  const diffMeses = Math.floor(diffDias / 30)
  
  if (diffSegundos < 60) return 'hace unos segundos'
  if (diffMinutos < 60) return `hace ${diffMinutos} minuto${diffMinutos !== 1 ? 's' : ''}`
  if (diffHoras < 24) return `hace ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`
  if (diffDias < 7) return `hace ${diffDias} día${diffDias !== 1 ? 's' : ''}`
  if (diffSemanas < 4) return `hace ${diffSemanas} semana${diffSemanas !== 1 ? 's' : ''}`
  if (diffMeses < 12) return `hace ${diffMeses} mes${diffMeses !== 1 ? 'es' : ''}`
  
  return fechaObj.toLocaleDateString('es-CL', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}
