/**
 * Script de migración de pacientes de localStorage a Supabase (F4-02c-2).
 *
 * Estrategia:
 * 1. Lee el array de pacientes de localStorage (clave studio_dental_pacientes_v3)
 * 2. Para cada paciente:
 *    a. Si ya fue migrado (tiene entrada en migrationStorageService), se omite
 *    b. Si no, se inserta en Supabase y se registra el mapeo legacyId → supabaseId
 * 3. Retorna un resumen de la migración (cantidad migrada, errores)
 *
 * Es idempotente: puede ejecutarse múltiples veces sin duplicar pacientes.
 *
 * Mapeo de campos (camelCase JS → snake_case SQL):
 * - contactoEmergencia → contacto_emergencia
 * - examenExtraoral → examen_extraoral
 * - examenIntraoral → examen_intraoral
 * - presionArterial → presion_arterial
 * - riesgoCariogenico → riesgo_cariogenico
 * - riesgoPeriodontal → riesgo_periodontal
 * - motivoConsulta → motivo_consulta
 * - anamnesisProxima → anamnesis_proxima
 * - fechaIngreso → fecha_ingreso
 */
import { supabase } from '../supabaseClient'
import { pacientesStorageService } from '../../modules/pacientes'
import { migrationStorageService } from '../migrationStorageService'
import { esUuidValido } from './uuidUtils'
import { createLogger } from '../logger.js'

const log = createLogger('migratePacientesToSupabase')

/**
 * Convierte un paciente de formato localStorage (camelCase) a formato
 * Supabase (snake_case).
 */
const transformarPacienteParaSupabase = (paciente, userId) => {
  return {
    user_id: userId,
    nombre: paciente.nombre,
    rut: paciente.rut,
    telefono: paciente.telefono || null,
    edad: paciente.edad ? String(paciente.edad) : null,
    prevision: paciente.prevision || null,
    email: paciente.email || null,
    direccion: paciente.direccion || null,
    ocupacion: paciente.ocupacion || null,
    contacto_emergencia: paciente.contactoEmergencia || null,
    peso: paciente.peso ? String(paciente.peso) : null,
    alergias: paciente.alergias || null,
    enfermedades: paciente.enfermedades || null,
    medicamentos: paciente.medicamentos || null,
    habitos: paciente.habitos || null,
    examen_extraoral: paciente.examenExtraoral || null,
    examen_intraoral: paciente.examenIntraoral || null,
    presion_arterial: paciente.presionArterial || null,
    riesgo_cariogenico: paciente.riesgoCariogenico || null,
    riesgo_periodontal: paciente.riesgoPeriodontal || null,
    motivo_consulta: paciente.motivoConsulta || null,
    anamnesis_proxima: paciente.anamnesisProxima || null,
    fecha_ingreso: paciente.fechaIngreso ? new Date(paciente.fechaIngreso).toISOString() : new Date().toISOString(),
    notas: paciente.notas || ''
  }
}

/**
 * Ejecuta la migración de pacientes de localStorage a Supabase.
 *
 * @param {string} userId - UUID del usuario autenticado en Supabase
 * @returns {Promise<{success: boolean, migrados: number, omitidos: number, errores: Array}>}
 */
export const migratePacientesToSupabase = async (userId) => {
  if (!supabase) {
    return {
      success: false,
      migrados: 0,
      omitidos: 0,
      errores: ['Supabase no configurado']
    }
  }

  if (!userId) {
    return {
      success: false,
      migrados: 0,
      omitidos: 0,
      errores: ['userId requerido para la migración']
    }
  }

  const pacientes = pacientesStorageService.obtenerPacientes([])
  const resultado = {
    success: true,
    migrados: 0,
    omitidos: 0,
    errores: []
  }

  // IDs de pacientes SEED que NO deben migrarse (son solo demo, no datos reales)
  const IDS_SEED = ['1', '2']

  for (const paciente of pacientes) {
    try {
      // F4-02c-fix: Filtrar pacientes SEED (Camila Silva ID=1, Carlos Mendoza ID=2)
      // Estos son datos de demostración que no deben estar en Supabase
      if (IDS_SEED.includes(String(paciente.id))) {
        log.info(`[migratePacientes] Omitiendo paciente SEED: ${paciente.nombre} (ID=${paciente.id})`)
        resultado.omitidos++
        continue
      }

      // Si ya tiene UUID, omitir (ya está en Supabase)
      if (esUuidValido(paciente.id)) {
        resultado.omitidos++
        continue
      }

      // Si ya fue migrado (legacyId mapeado a UUID), omitir
      if (migrationStorageService.yaFueMigrado(paciente.id)) {
        resultado.omitidos++
        continue
      }

      // Transformar a formato Supabase
      const pacienteSupabase = transformarPacienteParaSupabase(paciente, userId)

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('pacientes')
        .insert(pacienteSupabase)
        .select('id')
        .single()

      if (error) {
        resultado.errores.push({
          pacienteId: paciente.id,
          nombre: paciente.nombre,
          error: error.message
        })
        continue
      }

      // Registrar mapeo legacyId → supabaseId
      migrationStorageService.registrarMapeo(paciente.id, data.id)
      resultado.migrados++
    } catch (error) {
      resultado.errores.push({
        pacienteId: paciente.id,
        nombre: paciente.nombre,
        error: error.message
      })
    }
  }

  return resultado
}


/**
 * Verifica si hay pacientes pendientes de migrar.
 * Un paciente NO necesita migración si:
 * - Ya tiene un UUID de Supabase (ya está en Supabase)
 * - Tiene una entrada legacyId → uuid en el mapa de migración
 *
 * @returns {{total: number, pendientes: number, yaMigrados: number}}
 */
export const verificarPacientesPendientes = () => {
  const pacientes = pacientesStorageService.obtenerPacientes([])
  let yaMigrados = 0
  for (const paciente of pacientes) {
    // Si ya tiene UUID, ya está en Supabase (no necesita migración)
    if (esUuidValido(paciente.id)) {
      yaMigrados++
      continue
    }
    // Si tiene un legacyId mapeado a un UUID, ya fue migrado
    if (migrationStorageService.yaFueMigrado(paciente.id)) {
      yaMigrados++
    }
  }
  return {
    total: pacientes.length,
    pendientes: pacientes.length - yaMigrados,
    yaMigrados
  }
}
