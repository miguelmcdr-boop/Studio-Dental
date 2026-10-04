/**
 * Script de migración de citas de localStorage a Supabase (F4-02c-3).
 *
 * Estrategia:
 * 1. Lee el array de citas de localStorage (clave studio_dental_agenda_citas_v3)
 * 2. Para cada cita:
 *    a. Si ya fue migrada (tiene UUID), se omite
 *    b. Si pacienteId es legacy y no tiene UUID mapeado, se omite con warning
 *    c. Si pacienteId es null (bloqueo), se migra sin paciente_id
 *    d. Se normaliza el estado ('Agendado' → 'Agendada', 'En Sillón' → 'En Curso')
 *    e. Se inserta en Supabase y se registra el mapeo legacyId → supabaseId
 * 3. Retorna un resumen de la migración
 *
 * Es idempotente: puede ejecutarse múltiples veces sin duplicar citas.
 */
import { supabase } from '../supabaseClient'
import { agendaStorageService } from '../../../domains/operations/agenda'
import { migrationStorageService } from '../../persistence/migrationStorageService'
import { esUuidValido } from './uuidUtils'
import { createLogger } from '../../logging/logger'

const log = createLogger('migrateCitasToSupabase')

export interface MigrateCitasError {
  citaId: string | number
  pacienteNombre?: string | null
  error: string
  details?: unknown
  hint?: unknown
  code?: string
}

export interface MigrateCitasResult {
  success: boolean
  migradas: number
  omitidas: number
  errores: Array<MigrateCitasError | string>
}

export interface VerificarCitasPendientesResult {
  total: number
  pendientes: number
  yaMigradas: number
  sinPacienteMigrado: number
}

interface CitaLegacyItem {
  id: string | number
  pacienteId?: string | number | null
  pacienteNombre?: string | null
  pacienteTelefono?: string | number | null
  pacienteRut?: string | null
  fecha?: string | null
  fechaIso?: string | null
  horaInicio?: string | null
  horaFin?: string | null
  estado?: string | null
  trataMiento?: string | null
  motivo?: string | null
  boxAsignado?: string | number | null
  horaInicioAtencion?: string | null
  horaLlegadaEspera?: string | null
  notas?: string | null
  observacion?: string | null
  observaciones?: string | null
  esBloqueo?: boolean
  [key: string]: unknown
}

interface CitaSupabasePayload {
  user_id: string
  paciente_id: string | null
  paciente_nombre: string | null
  paciente_telefono: string | null
  paciente_rut: string | null
  fecha: string | null
  hora_inicio: string | null
  hora_fin: string | null
  estado: string
  motivo: string | null
  box_asignado: string | number | null
  hora_inicio_atencion: string | null
  notas: string
}

/**
 * Normaliza el estado de la cita al formato esperado por Supabase.
 * El código usa 'Agendado' (masculino) pero la tabla espera 'Agendada' (femenino).
 */
const normalizarEstado = (estado?: string | null): string => {
  if (!estado) return 'Agendada'
  const mapeo: Record<string, string> = {
    'Agendado': 'Agendada',
    'Confirmado': 'Confirmada',
    'En Sillón': 'En Curso',
    'Completado': 'Completada',
    'Cancelado': 'Cancelada',
    'No Asistió': 'No Asistió'
  }
  return mapeo[estado] || 'Agendada'
}

/**
 * Convierte una cita de formato localStorage (camelCase) a formato
 * Supabase (snake_case).
 *
 * IMPORTANTE: usa `fechaIso` como fallback si `fecha` está vacío.
 * Algunas citas legacy pueden tener solo uno de los dos campos.
 */
const transformarCitaParaSupabase = (
  cita: CitaLegacyItem,
  userId: string,
  pacienteUuid: string | null
): CitaSupabasePayload => {
  // Resolver fecha: usar fecha o fechaIso (algunas citas legacy tienen solo uno)
  const fecha = cita.fecha || cita.fechaIso || null

  return {
    user_id: userId,
    paciente_id: pacienteUuid || null,
    paciente_nombre: cita.pacienteNombre || null,
    paciente_telefono: cita.pacienteTelefono ? String(cita.pacienteTelefono) : null,
    paciente_rut: cita.pacienteRut || null,
    fecha,
    hora_inicio: cita.horaInicio || null,
    hora_fin: cita.horaFin || null,
    estado: normalizarEstado(cita.estado || 'Agendado'),
    motivo: cita.trataMiento || cita.motivo || null,
    box_asignado: cita.boxAsignado || null,
    hora_inicio_atencion: cita.horaInicioAtencion || cita.horaLlegadaEspera || null,
    notas: cita.notas || cita.observacion || cita.observaciones || ''
  }
}

/**
 * Valida que una cita tenga los campos obligatorios para insertar en Supabase.
 * Retorna { valido: boolean, razon: string, esBloqueo: boolean }
 *
 * Las citas que son "bloqueos de agenda" (esBloqueo: true) se omiten
 * porque no son citas reales de pacientes.
 */
const validarCitaParaMigracion = (
  cita: CitaLegacyItem
): { valido: boolean; razon: string; esBloqueo: boolean } => {
  // Si es un bloqueo de agenda, omitir
  if (cita.esBloqueo === true) {
    return { valido: false, razon: 'es un bloqueo de agenda (no es cita real)', esBloqueo: true }
  }

  // Validar fecha (puede estar en fecha o fechaIso)
  const fecha = cita.fecha || cita.fechaIso
  if (!fecha) {
    return { valido: false, razon: 'falta campo fecha y fechaIso', esBloqueo: false }
  }
  if (!cita.horaInicio) {
    return { valido: false, razon: 'falta campo horaInicio', esBloqueo: false }
  }
  if (!cita.estado) {
    return { valido: false, razon: 'falta campo estado', esBloqueo: false }
  }
  return { valido: true, razon: '', esBloqueo: false }
}

/**
 * Ejecuta la migración de citas de localStorage a Supabase.
 *
 * @param userId - UUID del usuario autenticado en Supabase
 * @returns resultado de la migración
 */
export const migrateCitasToSupabase = async (userId: string): Promise<MigrateCitasResult> => {
  if (!supabase) {
    return {
      success: false,
      migradas: 0,
      omitidas: 0,
      errores: ['Supabase no configurado']
    }
  }

  if (!userId) {
    return {
      success: false,
      migradas: 0,
      omitidas: 0,
      errores: ['userId requerido para la migración']
    }
  }

  const citas = agendaStorageService.obtenerCitas([]) as CitaLegacyItem[]
  const resultado: MigrateCitasResult = {
    success: true,
    migradas: 0,
    omitidas: 0,
    errores: []
  }

  for (const cita of citas) {
    try {
      // Si ya tiene UUID, omitir (ya está en Supabase)
      if (esUuidValido(cita.id)) {
        resultado.omitidas++
        continue
      }

      // Si ya fue migrada (legacyId mapeado a UUID), omitir
      if (migrationStorageService.yaFueMigrado(cita.id)) {
        resultado.omitidas++
        continue
      }

      // Resolver paciente_id
      let pacienteUuid: string | null = null
      if (cita.pacienteId) {
        if (esUuidValido(cita.pacienteId)) {
          pacienteUuid = String(cita.pacienteId)
        } else {
          // Intentar obtener UUID del mapa de migración
          pacienteUuid = migrationStorageService.obtenerSupabaseId(cita.pacienteId)
          if (!pacienteUuid) {
            log.warn(`Cita ${cita.id} omitida: paciente ${cita.pacienteId} no migrado aún`)
            resultado.omitidas++
            continue
          }
        }
      }

      // Validar campos obligatorios
      const validacion = validarCitaParaMigracion(cita)
      if (!validacion.valido) {
        if (validacion.esBloqueo) {
          log.info(`Cita ${cita.id} omitida: ${validacion.razon}`)
        } else {
          log.warn(`Cita ${cita.id} omitida: ${validacion.razon}`, {
            id: cita.id,
            fecha: cita.fecha,
            fechaIso: cita.fechaIso,
            horaInicio: cita.horaInicio,
            estado: cita.estado,
            pacienteNombre: cita.pacienteNombre
          })
        }
        resultado.omitidas++
        continue
      }

      // Transformar a formato Supabase
      const citaSupabase = transformarCitaParaSupabase(cita, userId, pacienteUuid)

      log.info(`Insertando cita ${cita.id}...`, {
        fecha: citaSupabase.fecha,
        hora_inicio: citaSupabase.hora_inicio,
        estado: citaSupabase.estado,
        paciente_id: citaSupabase.paciente_id
      })

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('citas')
        .insert(citaSupabase)
        .select('id')
        .single()

      if (error) {
        log.error(`Error al insertar cita ${cita.id}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        resultado.errores.push({
          citaId: cita.id,
          pacienteNombre: cita.pacienteNombre,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        continue
      }

      // Registrar mapeo legacyId → supabaseId
      migrationStorageService.registrarMapeo(cita.id, data.id)
      resultado.migradas++
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      resultado.errores.push({
        citaId: cita.id,
        pacienteNombre: cita.pacienteNombre,
        error: msg
      })
    }
  }

  return resultado
}

/**
 * Verifica si hay citas pendientes de migrar.
 */
export const verificarCitasPendientes = (): VerificarCitasPendientesResult => {
  const citas = agendaStorageService.obtenerCitas([]) as CitaLegacyItem[]
  let yaMigradas = 0
  let sinPacienteMigrado = 0

  for (const cita of citas) {
    if (esUuidValido(cita.id)) {
      yaMigradas++
      continue
    }
    if (migrationStorageService.yaFueMigrado(cita.id)) {
      yaMigradas++
      continue
    }
    // Verificar si el paciente está migrado
    if (cita.pacienteId && !esUuidValido(cita.pacienteId)) {
      const pacienteUuid = migrationStorageService.obtenerSupabaseId(cita.pacienteId)
      if (!pacienteUuid) {
        sinPacienteMigrado++
      }
    }
  }

  return {
    total: citas.length,
    pendientes: citas.length - yaMigradas,
    yaMigradas,
    sinPacienteMigrado
  }
}
