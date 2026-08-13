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
import { agendaStorageService } from '../../modules/agenda'
import { migrationStorageService } from '../migrationStorageService'
import { esUuidValido } from './uuidUtils'

/**
 * Normaliza el estado de la cita al formato esperado por Supabase.
 * El código usa 'Agendado' (masculino) pero la tabla espera 'Agendada' (femenino).
 */
const normalizarEstado = (estado) => {
  const mapeo = {
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
const transformarCitaParaSupabase = (cita, userId, pacienteUuid) => {
  // Resolver fecha: usar fecha o fechaIso (algunas citas legacy tienen solo uno)
  const fecha = cita.fecha || cita.fechaIso || null
  
  return {
    user_id: userId,
    paciente_id: pacienteUuid || null,
    paciente_nombre: cita.pacienteNombre || null,
    paciente_telefono: cita.pacienteTelefono ? String(cita.pacienteTelefono) : null,
    paciente_rut: cita.pacienteRut || null,
    fecha: fecha,
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
const validarCitaParaMigracion = (cita) => {
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
 * @param {string} userId - UUID del usuario autenticado en Supabase
 * @returns {Promise<{success: boolean, migradas: number, omitidas: number, errores: Array}>}
 */
export const migrateCitasToSupabase = async (userId) => {
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

  const citas = agendaStorageService.obtenerCitas([])
  const resultado = {
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
      let pacienteUuid = null
      if (cita.pacienteId) {
        if (esUuidValido(cita.pacienteId)) {
          pacienteUuid = cita.pacienteId
        } else {
          // Intentar obtener UUID del mapa de migración
          pacienteUuid = migrationStorageService.obtenerSupabaseId(cita.pacienteId)
          if (!pacienteUuid) {
            console.warn(`[migrateCitasToSupabase] Cita ${cita.id} omitida: paciente ${cita.pacienteId} no migrado aún`)
            resultado.omitidas++
            continue
          }
        }
      }

      // Validar campos obligatorios
      const validacion = validarCitaParaMigracion(cita)
      if (!validacion.valido) {
        if (validacion.esBloqueo) {
          console.log(`[migrateCitasToSupabase] Cita ${cita.id} omitida: ${validacion.razon}`)
        } else {
          console.warn(`[migrateCitasToSupabase] Cita ${cita.id} omitida: ${validacion.razon}`, {
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

      console.log(`[migrateCitasToSupabase] Insertando cita ${cita.id}...`, {
        fecha: citaSupabase.fecha,
        hora_inicio: citaSupabase.hora_inicio,
        estado: citaSupabase.estado,
        paciente_id: citaSupabase.paciente_id
      })

      // Insertar en Supabase
      console.log(`[migrateCitasToSupabase] Insertando cita ${cita.id}...`, citaSupabase)
      const { data, error } = await supabase
        .from('citas')
        .insert(citaSupabase)
        .select('id')
        .single()

      if (error) {
        console.error(`[migrateCitasToSupabase] Error al insertar cita ${cita.id}:`, {
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
    } catch (error) {
      resultado.errores.push({
        citaId: cita.id,
        pacienteNombre: cita.pacienteNombre,
        error: error.message
      })
    }
  }

  return resultado
}

/**
 * Verifica si hay citas pendientes de migrar.
 *
 * @returns {{total: number, pendientes: number, yaMigradas: number, sinPacienteMigrado: number}}
 */
export const verificarCitasPendientes = () => {
  const citas = agendaStorageService.obtenerCitas([])
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
