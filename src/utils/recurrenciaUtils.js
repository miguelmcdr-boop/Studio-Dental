/**
 * Recurrencia Utils — F7-27
 *
 * Genera citas recurrentes basadas en un patrón (semanal, mensual, anual).
 * Valida conflictos con citas existentes antes de generar.
 *
 * Uso:
 *   import { generarCitasRecurrencia, calcularProximaFechaRecurrencia } from '../utils/recurrenciaUtils'
 *
 *   const citasNuevas = generarCitasRecurrencia(citaBase, 10) // genera 10 instancias
 *   const proximaFecha = calcularProximaFechaRecurrencia(cita)
 */

/**
 * Calcula la próxima fecha de recurrencia basada en el patrón de la cita.
 *
 * @param {Object} cita - Cita con campos de recurrencia
 * @param {string} cita.fecha - Fecha actual (YYYY-MM-DD)
 * @param {string} cita.recurrencia - 'semanal' | 'mensual' | 'anual'
 * @param {number} [cita.frecuencia=1] - Cada X períodos
 * @returns {string|null} Próxima fecha (YYYY-MM-DD) o null si no hay recurrencia
 */
export const calcularProximaFechaRecurrencia = (cita) => {
  if (!cita.recurrencia || cita.recurrencia === 'ninguna') return null

  const fechaActual = new Date(cita.fecha + 'T00:00:00')
  const frecuencia = cita.frecuencia || 1

  switch (cita.recurrencia) {
    case 'semanal': {
      fechaActual.setDate(fechaActual.getDate() + (7 * frecuencia))
      break
    }
    case 'mensual': {
      fechaActual.setMonth(fechaActual.getMonth() + frecuencia)
      break
    }
    case 'anual': {
      fechaActual.setFullYear(fechaActual.getFullYear() + frecuencia)
      break
    }
    default:
      return null
  }

  const year = fechaActual.getFullYear()
  const month = String(fechaActual.getMonth() + 1).padStart(2, '0')
  const day = String(fechaActual.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Genera un array de citas recurrentes basadas en una cita base.
 *
 * @param {Object} citaBase - Cita con campos de recurrencia
 * @param {number} numInstancias - Número de instancias a generar (incluye la cita base)
 * @returns {Array} Array de citas generadas (sin la cita base, solo las futuras)
 */
export const generarCitasRecurrencia = (citaBase, numInstancias = 10) => {
  if (!citaBase.recurrencia || citaBase.recurrencia === 'ninguna') return []

  const citasGeneradas = []
  let citaActual = { ...citaBase }
  const citaPadreId = citaBase.id

  for (let i = 0; i < numInstancias; i++) {
    const proximaFecha = calcularProximaFechaRecurrencia(citaActual)
    if (!proximaFecha) break

    // Verificar si excede fechaFin
    if (citaBase.fechaFin && proximaFecha > citaBase.fechaFin) break

    const nuevaCita = {
      ...citaBase,
      id: `${citaPadreId}_rec_${Date.now()}_${i}`,
      fecha: proximaFecha,
      citaPadreId: citaPadreId,
      recurrencia: 'ninguna', // Las instancias generadas no son recurrentes
      frecuencia: undefined,
      diaSemana: undefined,
      diaMes: undefined,
      fechaFin: undefined,
    }

    citasGeneradas.push(nuevaCita)
    citaActual = { ...citaActual, fecha: proximaFecha }
  }

  return citasGeneradas
}

/**
 * Valida que no haya conflictos de horario para una nueva cita recurrente.
 *
 * @param {Object} nuevaCita - Cita a validar
 * @param {Array} citasExistentes - Citas existentes en el sistema
 * @returns {{ valido: boolean, conflictos: Array }}
 */
export const validarConflictosRecurrencia = (nuevaCita, citasExistentes = []) => {
  const conflictos = citasExistentes.filter((cita) => {
    if (cita.fecha !== nuevaCita.fecha) return false
    if (cita.boxAsignado !== nuevaCita.boxAsignado) return false
    if (cita.id === nuevaCita.id) return false // misma cita, no es conflicto

    // Verificar solapamiento de horarios (asumiendo duración de 30 min si no hay horaFin)
    const horaNueva = nuevaCita.horaInicio
    const horaExistente = cita.horaInicio

    return horaNueva === horaExistente // Simplificado: misma hora = conflicto
  })

  return {
    valido: conflictos.length === 0,
    conflictos,
  }
}
