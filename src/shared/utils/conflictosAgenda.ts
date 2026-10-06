/**
 * Detección de conflictos de agenda (F5-05).
 *
 * Identifica si dos citas del mismo paciente se superponen en el tiempo.
 * Usado por ModalNuevaCita (trabajo incremental posterior).
 *
 * API pública:
 * - detectarConflictoAgenda(nuevaCita, citasExistentes) → { hayConflicto, citasConflictivas }
 * - convertirAHoras(cita) → { inicioMs, finMs }
 */

export interface CitaHorario {
  id?: string | number
  fecha?: string
  horaInicio?: string
  duracionMinutos?: number | string
  pacienteId?: string | number
  estado?: string
  [key: string]: unknown
}

export interface IntervaloHoras {
  inicioMs: number
  finMs: number
}

export interface ConflictoAgendaResultado<T = CitaHorario> {
  hayConflicto: boolean
  citasConflictivas: T[]
}

/**
 * Convierte una cita en timestamps numéricos (inicio, fin).
 *
 * @param cita - Cita con campos fecha (ISO), horaInicio (HH:MM), duracionMinutos
 */
export const convertirAHoras = (cita?: CitaHorario | null): IntervaloHoras | null => {
  if (!cita?.fecha || !cita?.horaInicio) return null

  const fechaBase = cita.fecha.split('T')[0] // YYYY-MM-DD
  const horaInicio = String(cita.horaInicio).padStart(5, '0')
  const [horaStr, minutoStr] = horaInicio.split(':')

  const hora = parseInt(horaStr, 10)
  const minuto = parseInt(minutoStr, 10)

  if (Number.isNaN(hora) || Number.isNaN(minuto)) return null

  const fechaCita = new Date(`${fechaBase}T00:00:00`)
  fechaCita.setHours(hora, minuto, 0, 0)

  const inicioMs = fechaCita.getTime()
  const duracionMin = parseInt(String(cita.duracionMinutos), 10) || 30
  const finMs = inicioMs + duracionMin * 60 * 1000

  return { inicioMs, finMs }
}

/**
 * Verifica si dos citas se superponen en el tiempo.
 */
const seSuperponen = (citaA: CitaHorario, citaB: CitaHorario): boolean => {
  const a = convertirAHoras(citaA)
  const b = convertirAHoras(citaB)

  if (!a || !b) return false

  // Dos intervalos [A_ini, A_fin] y [B_ini, B_fin] se superponen si:
  // A_ini < B_fin Y B_ini < A_fin
  return a.inicioMs < b.finMs && b.inicioMs < a.finMs
}

/**
 * Detecta si una nueva cita entra en conflicto con citas existentes.
 *
 * Solo considera conflictos para el MISMO paciente. Citas de diferentes
 * pacientes no generan conflicto (incluso si están en el mismo horario).
 *
 * @param nuevaCita - Cita a validar
 * @param citasExistentes - Lista de citas ya agendadas
 */
export const detectarConflictoAgenda = <T extends CitaHorario>(
  nuevaCita?: T | null,
  citasExistentes: T[] = []
): ConflictoAgendaResultado<T> => {
  if (!nuevaCita?.pacienteId || !Array.isArray(citasExistentes)) {
    return { hayConflicto: false, citasConflictivas: [] }
  }

  // Ignorar si la cita nueva está cancelada
  if (nuevaCita.estado === 'Cancelada' || nuevaCita.estado === 'Cancelado') {
    return { hayConflicto: false, citasConflictivas: [] }
  }

  const mismoPacienteId = String(nuevaCita.pacienteId)

  const citasConflictivas = citasExistentes.filter((existente: T): boolean => {
    // Ignorar citas canceladas existentes
    if (existente.estado === 'Cancelada' || existente.estado === 'Cancelado') {
      return false
    }

    // Solo mismo paciente
    if (String(existente.pacienteId) !== mismoPacienteId) {
      return false
    }

    // Ignorar la misma cita (edición)
    if (existente.id && nuevaCita.id && String(existente.id) === String(nuevaCita.id)) {
      return false
    }

    return seSuperponen(nuevaCita, existente)
  })

  return {
    hayConflicto: citasConflictivas.length > 0,
    citasConflictivas
  }
}
