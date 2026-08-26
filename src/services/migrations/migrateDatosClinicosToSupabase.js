/**
 * Script de migración de datos clínicos de localStorage a Supabase (F4-02c-6).
 *
 * Estrategia:
 * 1. Itera sobre todos los pacientes migrados (con UUID en Supabase)
 * 2. Para cada paciente, lee las claves dinámicas de localStorage:
 *    - evoluciones_notas_${pacienteId}
 *    - recetas_${pacienteId}
 *    - odonto_inicial_${pacienteId}
 *    - odonto_evolucion_${pacienteId}
 *    - periodontograma_${pacienteId}
 *    - periodontograma_control_${pacienteId}
 *    - periodonto_historial_${pacienteId}
 *    - dsd_config_${pacienteId}
 *    - pediatria_${pacienteId}
 *    - quirurgico_implantes_${pacienteId}
 *    - quirurgico_endodoncia_${pacienteId}
 * 3. Transforma y sube a las tablas correspondientes en Supabase
 * 4. Retorna un resumen de la migración
 *
 * Nota: Este script NO modifica los componentes que usan estos datos.
 * Los componentes seguirán usando localStorage y se refactorizarán en F4-02d.
 * Esta fase es solo para asegurar que los datos estén respaldados en Supabase.
 */
import { supabase } from '../supabaseClient'
import { migrationStorageService } from '../migrationStorageService'
import { leerJSON } from '../localStorageRepository'
import { createLogger } from '../../logger'

const log = createLogger('migrateDatosClinicosToSupabase')

/**
 * Migraciones específicas para cada tipo de dato clínico.
 */
const migrarEvoluciones = async (pacienteUuid, userId, evoluciones) => {
  let migradas = 0
  let errores = []

  if (!Array.isArray(evoluciones) || evoluciones.length === 0) {
    return { migradas: 0, errores: [] }
  }

  for (const evolucion of evoluciones) {
    try {
      // Generar un ID único para la evolución si no tiene
      const evolucionId = evolucion.id || `${pacienteUuid}_${Date.now()}_${Math.random()}`
      
      // Verificar si ya fue migrada
      if (migrationStorageService.yaFueMigrado(evolucionId)) continue

      const evolucionSupabase = {
        user_id: userId,
        paciente_id: pacienteUuid,
        fecha_hora: evolucion.fechaHora || evolucion.fecha || new Date().toISOString(),
        texto: evolucion.texto || evolucion.nota || '',
        tipo: evolucion.tipo || 'evolucion'
      }

      const { error } = await supabase
        .from('evoluciones_clinicas')
        .insert(evolucionSupabase)

      if (error) {
        errores.push({ tipo: 'evolucion', id: evolucionId, error: error.message })
        continue
      }

      migrationStorageService.registrarMapeo(evolucionId, `${pacienteUuid}_evolucion`)
      migradas++
    } catch (error) {
      errores.push({ tipo: 'evolucion', error: error.message })
    }
  }

  return { migradas, errores }
}

const migrarRecetas = async (pacienteUuid, userId, recetas) => {
  let migradas = 0
  let errores = []

  if (!Array.isArray(recetas) || recetas.length === 0) {
    return { migradas: 0, errores: [] }
  }

  for (const receta of recetas) {
    try {
      const recetaId = receta.id || `${pacienteUuid}_${Date.now()}_${Math.random()}`
      
      if (migrationStorageService.yaFueMigrado(recetaId)) continue

      const recetaSupabase = {
        user_id: userId,
        paciente_id: pacienteUuid,
        fecha: receta.fecha || new Date().toISOString().split('T')[0],
        medicamentos: receta.medicamentos || [],
        diagnostico: receta.diagnostico || '',
        indicaciones: receta.indicaciones || '',
        firma: receta.firma || ''
      }

      const { error } = await supabase
        .from('recetas')
        .insert(recetaSupabase)

      if (error) {
        errores.push({ tipo: 'receta', id: recetaId, error: error.message })
        continue
      }

      migrationStorageService.registrarMapeo(recetaId, `${pacienteUuid}_receta`)
      migradas++
    } catch (error) {
      errores.push({ tipo: 'receta', error: error.message })
    }
  }

  return { migradas, errores }
}

const migrarOdontograma = async (pacienteUuid, userId, odontograma, tipo) => {
  try {
    if (!odontograma || Object.keys(odontograma).length === 0) {
      return { migrado: false, error: null }
    }

    const odontogramaSupabase = {
      user_id: userId,
      paciente_id: pacienteUuid,
      tipo: tipo,
      datos: odontograma,
      fecha_registro: new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('odontogramas')
      .insert(odontogramaSupabase)

    if (error) {
      return { migrado: false, error: error.message }
    }

    return { migrado: true, error: null }
  } catch (error) {
    return { migrado: false, error: error.message }
  }
}

const migrarPeriodontograma = async (pacienteUuid, userId, periodontograma, tipo) => {
  try {
    if (!periodontograma || Object.keys(periodontograma).length === 0) {
      return { migrado: false, error: null }
    }

    const periodontogramaSupabase = {
      user_id: userId,
      paciente_id: pacienteUuid,
      tipo: tipo,
      datos: periodontograma,
      fecha_registro: new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('periodontogramas')
      .insert(periodontogramaSupabase)

    if (error) {
      return { migrado: false, error: error.message }
    }

    return { migrado: true, error: null }
  } catch (error) {
    return { migrado: false, error: error.message }
  }
}

const migrarDatosGenericos = async (pacienteUuid, userId, datos, tabla) => {
  try {
    if (!datos || (Array.isArray(datos) && datos.length === 0) || 
        (!Array.isArray(datos) && Object.keys(datos).length === 0)) {
      return { migrado: false, error: null }
    }

    const datosSupabase = {
      user_id: userId,
      paciente_id: pacienteUuid,
      datos: datos
    }

    const { error } = await supabase
      .from(tabla)
      .insert(datosSupabase)

    if (error) {
      return { migrado: false, error: error.message }
    }

    return { migrado: true, error: null }
  } catch (error) {
    return { migrado: false, error: error.message }
  }
}

/**
 * Ejecuta la migración de datos clínicos de localStorage a Supabase.
 *
 * @param {string} userId - UUID del usuario autenticado en Supabase
 * @returns {Promise<{success: boolean, evolucionesMigradas: number, recetasMigradas: number, otrosMigrados: number, errores: Array}>}
 */
export const migrateDatosClinicosToSupabase = async (userId) => {
  if (!supabase) {
    return {
      success: false,
      evolucionesMigradas: 0,
      recetasMigradas: 0,
      otrosMigrados: 0,
      errores: ['Supabase no configurado']
    }
  }

  if (!userId) {
    return {
      success: false,
      evolucionesMigradas: 0,
      recetasMigradas: 0,
      otrosMigrados: 0,
      errores: ['userId requerido para la migración']
    }
  }

  const resultado = {
    success: true,
    evolucionesMigradas: 0,
    recetasMigradas: 0,
    otrosMigrados: 0,
    errores: []
  }

  log.info('[migrateDatosClinicos] Iniciando migración de datos clínicos...')

  // Obtener todos los pacientes migrados
  const { data: pacientes } = await supabase
    .from('pacientes')
    .select('id')

  if (!Array.isArray(pacientes) || pacientes.length === 0) {
    log.info('[migrateDatosClinicos] No hay pacientes migrados, omitiendo')
    return resultado
  }

  for (const paciente of pacientes) {
    try {
      // Buscar el legacyId de este paciente
      const legacyId = migrationStorageService.obtenerLegacyId(paciente.id)
      if (!legacyId) continue

      log.info(`[migrateDatosClinicos] Migrando datos del paciente ${legacyId}...`)

      // 1. Evoluciones clínicas
      const evoluciones = leerJSON(`evoluciones_notas_${legacyId}`, [])
      const resultadoEvoluciones = await migrarEvoluciones(paciente.id, userId, evoluciones)
      resultado.evolucionesMigradas += resultadoEvoluciones.migradas
      resultado.errores.push(...resultadoEvoluciones.errores)

      // 2. Recetas
      const recetas = leerJSON(`recetas_${legacyId}`, [])
      const resultadoRecetas = await migrarRecetas(paciente.id, userId, recetas)
      resultado.recetasMigradas += resultadoRecetas.migradas
      resultado.errores.push(...resultadoRecetas.errores)

      // 3. Odontograma inicial
      const odontoInicial = leerJSON(`odonto_inicial_${legacyId}`, {})
      const resultadoOdontoInicial = await migrarOdontograma(paciente.id, userId, odontoInicial, 'inicial')
      if (resultadoOdontoInicial.migrado) resultado.otrosMigrados++
      if (resultadoOdontoInicial.error) resultado.errores.push({ tipo: 'odontograma_inicial', error: resultadoOdontoInicial.error })

      // 4. Odontograma evolución
      const odontoEvolucion = leerJSON(`odonto_evolucion_${legacyId}`, {})
      const resultadoOdontoEvolucion = await migrarOdontograma(paciente.id, userId, odontoEvolucion, 'evolucion')
      if (resultadoOdontoEvolucion.migrado) resultado.otrosMigrados++
      if (resultadoOdontoEvolucion.error) resultado.errores.push({ tipo: 'odontograma_evolucion', error: resultadoOdontoEvolucion.error })

      // 5. Periodontograma inicial
      const periodontoInicial = leerJSON(`periodontograma_${legacyId}`, {})
      const resultadoPeriodontoInicial = await migrarPeriodontograma(paciente.id, userId, periodontoInicial, 'inicial')
      if (resultadoPeriodontoInicial.migrado) resultado.otrosMigrados++
      if (resultadoPeriodontoInicial.error) resultado.errores.push({ tipo: 'periodontograma_inicial', error: resultadoPeriodontoInicial.error })

      // 6. Periodontograma control
      const periodontoControl = leerJSON(`periodontograma_control_${legacyId}`, {})
      const resultadoPeriodontoControl = await migrarPeriodontograma(paciente.id, userId, periodontoControl, 'control')
      if (resultadoPeriodontoControl.migrado) resultado.otrosMigrados++
      if (resultadoPeriodontoControl.error) resultado.errores.push({ tipo: 'periodontograma_control', error: resultadoPeriodontoControl.error })

      // 7. Historial periodontal
      const periodontoHistorial = leerJSON(`periodonto_historial_${legacyId}`, {})
      const resultadoPeriodontoHistorial = await migrarDatosGenericos(paciente.id, userId, periodontoHistorial, 'periodontogramas_historial')
      if (resultadoPeriodontoHistorial.migrado) resultado.otrosMigrados++
      if (resultadoPeriodontoHistorial.error) resultado.errores.push({ tipo: 'periodonto_historial', error: resultadoPeriodontoHistorial.error })

      // 8. DSD config
      const dsdConfig = leerJSON(`dsd_config_${legacyId}`, {})
      const resultadoDsd = await migrarDatosGenericos(paciente.id, userId, dsdConfig, 'dsd_configs')
      if (resultadoDsd.migrado) resultado.otrosMigrados++
      if (resultadoDsd.error) resultado.errores.push({ tipo: 'dsd_config', error: resultadoDsd.error })

      // 9. Odontopediatría
      const pediatria = leerJSON(`pediatria_${legacyId}`, {})
      const resultadoPediatria = await migrarDatosGenericos(paciente.id, userId, pediatria, 'odontopediatria')
      if (resultadoPediatria.migrado) resultado.otrosMigrados++
      if (resultadoPediatria.error) resultado.errores.push({ tipo: 'pediatria', error: resultadoPediatria.error })

      // 10. Quirúrgico implantes
      const implantes = leerJSON(`quirurgico_implantes_${legacyId}`, [])
      const resultadoImplantes = await migrarDatosGenericos(paciente.id, userId, implantes, 'quirurgico_implantes')
      if (resultadoImplantes.migrado) resultado.otrosMigrados++
      if (resultadoImplantes.error) resultado.errores.push({ tipo: 'implantes', error: resultadoImplantes.error })

      // 11. Quirúrgico endodoncia
      const endodoncia = leerJSON(`quirurgico_endodoncia_${legacyId}`, [])
      const resultadoEndodoncia = await migrarDatosGenericos(paciente.id, userId, endodoncia, 'quirurgico_endodoncia')
      if (resultadoEndodoncia.migrado) resultado.otrosMigrados++
      if (resultadoEndodoncia.error) resultado.errores.push({ tipo: 'endodoncia', error: resultadoEndodoncia.error })

    } catch (error) {
      log.error(`[migrateDatosClinicos] Error procesando paciente ${paciente.id}:`, error.message)
      resultado.errores.push({ tipo: 'paciente', pacienteId: paciente.id, error: error.message })
    }
  }

  return resultado
}

/**
 * Verifica si hay datos clínicos pendientes de migrar.
 * Esta es una verificación simple que cuenta pacientes con datos.
 *
 * @returns {{totalPacientes: number, conDatos: number}}
 */
export const verificarDatosClinicosPendientes = () => {
  // Esta verificación es simplificada porque los datos clínicos están
  // distribuidos en muchas claves dinámicas. Solo contamos pacientes
  // que podrían tener datos.
  
  // Obtener pacientes de localStorage (fuente de verdad para esta verificación)
  const pacientesRaw = localStorage.getItem('studio_dental_pacientes_v3')
  let pacientes = []
  try {
    pacientes = pacientesRaw ? JSON.parse(pacientesRaw) : []
  } catch {
    pacientes = []
  }

  let conDatos = 0
  for (const paciente of pacientes) {
    const evoluciones = leerJSON(`evoluciones_notas_${paciente.id}`, [])
    const recetas = leerJSON(`recetas_${paciente.id}`, [])
    const odontoInicial = leerJSON(`odonto_inicial_${paciente.id}`, {})
    
    if (evoluciones.length > 0 || recetas.length > 0 || Object.keys(odontoInicial).length > 0) {
      conDatos++
    }
  }

  return {
    totalPacientes: pacientes.length,
    conDatos
  }
}
