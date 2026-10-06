/**
 * Funciones de transformación y mapeo de datos de agenda (citas)
 * Extraído de agendaStorageService.js para respetar límite arquitectónico
 */
import { migrationStorageService } from '../../../../infrastructure/persistence/migrationStorageService'
import { esUuidValido } from '../../../../infrastructure/supabase/migrations/uuidUtils'
import type { Cita } from '../schemas/citaSchema'

export const ESTADO_CODIGO_A_SUPABASE: Readonly<Record<string, string>> = {
  'Agendado': 'Agendada',
  'Confirmado': 'Confirmada',
  'En Sillón': 'En Curso',
  'Completado': 'Completada',
  'Cancelado': 'Cancelada',
  'No Asistió': 'No Asistió',
  'Agendada': 'Agendada',
  'Confirmada': 'Confirmada',
  'En Curso': 'En Curso',
  'Completada': 'Completada',
  'Cancelada': 'Cancelada'
}

export const ESTADO_SUPABASE_A_CODIGO: Readonly<Record<string, string>> = {
  'Agendada': 'Agendado',
  'Confirmada': 'Confirmado',
  'En Curso': 'En Sillón',
  'Completada': 'Completado',
  'Cancelada': 'Cancelado',
  'No Asistió': 'No Asistió',
  'Agendado': 'Agendado',
  'Confirmado': 'Confirmado',
  'En Sillón': 'En Sillón',
  'Completado': 'Completado',
  'Cancelado': 'Cancelado'
}

export const normalizarEstadoParaSupabase = (estado: unknown): string => {
  if (typeof estado !== 'string') return 'Agendada'
  return ESTADO_CODIGO_A_SUPABASE[estado] || 'Agendada'
}

export const desnormalizarEstadoParaCodigo = (estado: unknown): string => {
  if (typeof estado !== 'string') return 'Agendado'
  return ESTADO_SUPABASE_A_CODIGO[estado] || 'Agendado'
}

export const SNAKE_TO_CAMEL_MAP: Readonly<Record<string, string>> = {
  paciente_id: 'pacienteId',
  paciente_nombre: 'pacienteNombre',
  paciente_telefono: 'pacienteTelefono',
  paciente_rut: 'pacienteRut',
  hora_inicio: 'horaInicio',
  hora_fin: 'horaFin',
  box_asignado: 'boxAsignado',
  hora_inicio_atencion: 'horaInicioAtencion',
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
}

export const CAMEL_TO_SNAKE_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

/**
 * Convierte una cita de Supabase (snake_case) a formato JS (camelCase).
 */
export const transformarDesdeSupabase = <T extends Record<string, unknown> = Cita>(
  citaDb: Record<string, unknown> | null | undefined
): T | null => {
  if (!citaDb) return null
  const resultado: Record<string, unknown> = {}
  for (const [claveDb, valor] of Object.entries(citaDb)) {
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    if (claveJs === 'estado') {
      resultado[claveJs] = desnormalizarEstadoParaCodigo(valor)
    } else {
      resultado[claveJs] = valor
    }
  }
  return resultado as T
}

/**
 * Convierte una cita de formato JS (camelCase) a Supabase (snake_case).
 */
export const transformarParaSupabase = (
  citaJs: Record<string, unknown> | null | undefined
): Record<string, unknown> | null => {
  if (!citaJs) return null
  const resultado: Record<string, unknown> = {}
  for (const [claveJs, valor] of Object.entries(citaJs)) {
    if (claveJs === 'createdAt' || claveJs === 'updatedAt' || claveJs === 'userId') {
      continue
    }
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs] || claveJs
    if (claveJs === 'estado') {
      resultado[claveDb] = normalizarEstadoParaSupabase(valor)
    } else if (claveJs === 'pacienteId') {
      if (typeof valor === 'string' && esUuidValido(valor)) {
        resultado.paciente_id = valor
      } else if (valor !== null && valor !== undefined) {
        const pacienteUuid = migrationStorageService.obtenerSupabaseId(String(valor))
        resultado.paciente_id = pacienteUuid || null
      } else {
        resultado.paciente_id = null
      }
    } else if (valor === '') {
      resultado[claveDb] = null
    } else if (valor !== undefined) {
      resultado[claveDb] = valor
    }
  }
  return resultado
}
