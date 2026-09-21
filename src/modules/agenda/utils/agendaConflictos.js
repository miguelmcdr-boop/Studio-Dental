/**
 * agendaConflictos — Detección de conflictos de horario (F10-C3.13)
 *
 * Valida que un nuevo bloqueo de agenda no se superponga con
 * citas existentes o bloqueos previos en el mismo box.
 */

const ESTADOS_EXCLUIR = ['Anulado']
const TODOS_LOS_BOXES = 'Todos los Boxes'

/**
 * Detecta conflictos entre un nuevo bloqueo y citas/bloqueos existentes.
 * @param {Object} nuevoBloqueo - { fecha, horaInicio, horaFin, boxAsignado }
 * @param {Array} citasExistentes - Lista de citas/bloqueos
 * @returns {{ hayConflicto: boolean, citasConflicto: Array }}
 */
export const detectarConflictoBloqueo = (nuevoBloqueo, citasExistentes = []) => {
  if (!nuevoBloqueo || !nuevoBloqueo.horaInicio || !nuevoBloqueo.horaFin) {
    return { hayConflicto: false, citasConflicto: [] }
  }

  const { fecha, horaInicio, horaFin, boxAsignado } = nuevoBloqueo

  const citasConflicto = citasExistentes.filter(c => {
    // Excluir anuladas y sin horarios
    if (ESTADOS_EXCLUIR.includes(c.estado) || !c.horaInicio || !c.horaFin) return false

    // Misma fecha (fecha o fechaIso)
    const fechaA = fecha || nuevoBloqueo.fechaIso
    const fechaB = c.fecha || c.fechaIso
    if (!fechaA || !fechaB || String(fechaA) !== String(fechaB)) return false

    // Mismo box (o "Todos los Boxes")
    const boxA = boxAsignado || TODOS_LOS_BOXES
    const boxB = c.boxAsignado || TODOS_LOS_BOXES
    if (boxA !== TODOS_LOS_BOXES && boxB !== TODOS_LOS_BOXES && String(boxA) !== String(boxB)) return false

    // Rangos solapados: A_start < B_end AND A_end > B_start
    return horaInicio < c.horaFin && horaFin > c.horaInicio
  })

  return { hayConflicto: citasConflicto.length > 0, citasConflicto }
}
