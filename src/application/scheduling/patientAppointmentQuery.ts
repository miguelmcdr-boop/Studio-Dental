/**
 * Application Service: patientAppointmentQuery (Fase 4A-1)
 *
 * Resuelve el ciclo de dependencia Pacientes ↔ Agenda.
 * Centraliza las consultas de citas para la vista/ficha de pacientes,
 * consumiendo únicamente la API pública del dominio Agenda.
 */
import { agendaStorageService, type Cita } from '../../domains/operations/agenda'

export interface ProximaCitaResumen {
  fecha: string
  hora: string | null
  box: string | null
  motivo: string | null
}

const parseFecha = (fecha?: string | Date | null): Date | null => {
  if (!fecha) return null
  if (fecha instanceof Date) return isNaN(fecha.getTime()) ? null : fecha
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) {
      const d = new Date(fecha)
      return isNaN(d.getTime()) ? null : d
    }
    const isoMatch = fecha.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
    if (isoMatch) return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`)
    const dmyMatch = fecha.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
    if (dmyMatch) return new Date(`${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}T00:00:00`)
    const d = new Date(fecha)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

/**
 * Obtiene la próxima cita futura agendada para un paciente dado.
 *
 * @param pacienteId ID del paciente (string o number)
 * @param fechaReferencia Fecha base de comparación (por defecto `new Date()`)
 * @returns Resumen de la próxima cita o `null` si no hay citas futuras
 */
export const obtenerProximaCitaPaciente = (
  pacienteId: string | number | undefined | null,
  fechaReferencia: Date = new Date()
): ProximaCitaResumen | null => {
  if (!pacienteId) return null

  try {
    if (!agendaStorageService?.obtenerCitas) return null

    const todasCitas = agendaStorageService.obtenerCitas() || []
    const hoyInicio = new Date(fechaReferencia.toDateString())

    const citasPaciente = todasCitas
      .filter(
        (c) =>
          String(c.pacienteId) === String(pacienteId) &&
          c.estado !== 'Cancelada' &&
          c.fecha
      )
      .map((c) => ({ ...c, _fechaObj: parseFecha(c.fecha) }))
      .filter((c): c is typeof c & { _fechaObj: Date } => c._fechaObj !== null && c._fechaObj >= hoyInicio)
      .sort((a, b) => a._fechaObj.getTime() - b._fechaObj.getTime())

    if (!citasPaciente[0]) return null

    const c0 = citasPaciente[0] as unknown as Record<string, unknown>
    return {
      fecha: String(c0.fecha || ''),
      hora: (c0.horaInicio as string) || (c0.hora as string) || null,
      box: (c0.boxAsignado as string) || null,
      motivo: (c0.trataMiento as string) || (c0.motivo as string) || null,
    }
  } catch {
    return null
  }
}

/**
 * Obtiene todas las citas asociadas a un paciente dado.
 *
 * @param pacienteId ID del paciente
 * @returns Lista de citas del paciente
 */
export const obtenerCitasPaciente = (
  pacienteId: string | number | undefined | null
): Cita[] => {
  if (!pacienteId) return []

  try {
    if (!agendaStorageService?.obtenerCitas) return []
    const todasCitas = agendaStorageService.obtenerCitas() || []
    return todasCitas.filter((c) => String(c.pacienteId) === String(pacienteId))
  } catch {
    return []
  }
}
