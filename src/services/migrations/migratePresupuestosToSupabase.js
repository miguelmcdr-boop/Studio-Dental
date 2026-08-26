/**
 * Script de migración de presupuestos de localStorage a Supabase (F4-02c-4).
 *
 * Estrategia:
 * 1. Lee presupuestos globales de localStorage (clave studio_dental_presupuestos_globales)
 * 2. Para cada presupuesto:
 *    a. Si ya tiene UUID, se omite
 *    b. Si ya fue migrado (legacyId mapeado), se omite
 *    c. Se convierte pacienteId legacy → UUID usando migrationStorageService
 *    d. Se inserta en Supabase y se registra el mapeo legacyId → supabaseId
 * 3. Para cada presupuesto migrado, migra sus items (si existen)
 * 4. Migra también items "huérfanos" (que están en presupuesto_items_${pacienteId}
 *    pero no tienen un presupuesto global asociado)
 * 5. Retorna un resumen de la migración
 *
 * Es idempotente: puede ejecutarse múltiples veces sin duplicar presupuestos.
 *
 * Nota: Los métodos de items (obtenerItemsPorPaciente, sincronizarConFichaPaciente)
 * siguen usando localStorage en esta fase. Se migrarán completamente en F4-02d
 * cuando refactoricemos los componentes que los usan directamente.
 */
import { supabase } from '../supabaseClient'
import { presupuestosStorageService } from '../../modules/presupuestos/services/presupuestosStorageService'
import { migrationStorageService } from '../migrationStorageService'
import { esUuidValido } from './uuidUtils'
import { leerJSON } from '../localStorageRepository'
import { createLogger } from '../logger'

const log = createLogger('migratePresupuestosToSupabase')

/**
 * Convierte un presupuesto de formato localStorage (camelCase) a formato
 * Supabase (snake_case).
 */
const transformarPresupuestoParaSupabase = (presupuesto, userId, pacienteUuid) => {
  return {
    user_id: userId,
    paciente_id: pacienteUuid || null,
    folio: presupuesto.folio || `PRES-${Date.now()}`,
    paciente_nombre: presupuesto.pacienteNombre || 'Sin nombre',
    paciente_rut: presupuesto.pacienteRut || null,
    fecha_emision: presupuesto.fechaEmision || new Date().toISOString().split('T')[0],
    convenio: presupuesto.convenio || 'Particular',
    monto_total: presupuesto.montoTotal || 0,
    monto_abonado: presupuesto.montoAbonado || 0,
    estado: presupuesto.estado || 'Emitido',
    observacion: presupuesto.observacion || ''
  }
}

/**
 * Convierte un item de presupuesto de formato localStorage a Supabase.
 */
const transformarItemParaSupabase = (item, presupuestoUuid, pacienteUuid) => {
  return {
    presupuesto_id: presupuestoUuid || null,
    paciente_id: pacienteUuid || null,
    prestacion_id: null, // Las prestaciones no se migran aún (F4-02c-6)
    prestacion_nombre: item.prestacionNombre || item.nombre || 'Sin nombre',
    valor: item.valor || 0,
    convenio: item.convenio || 'Particular',
    estado: item.estado || 'Pendiente'
  }
}

/**
 * Ejecuta la migración de presupuestos de localStorage a Supabase.
 *
 * @param {string} userId - UUID del usuario autenticado en Supabase
 * @returns {Promise<{success: boolean, migrados: number, itemsMigrados: number, omitidos: number, errores: Array}>}
 */
export const migratePresupuestosToSupabase = async (userId) => {
  if (!supabase) {
    return {
      success: false,
      migrados: 0,
      itemsMigrados: 0,
      omitidos: 0,
      errores: ['Supabase no configurado']
    }
  }

  if (!userId) {
    return {
      success: false,
      migrados: 0,
      itemsMigrados: 0,
      omitidos: 0,
      errores: ['userId requerido para la migración']
    }
  }

  const presupuestos = presupuestosStorageService.obtenerPresupuestos([])
  const resultado = {
    success: true,
    migrados: 0,
    itemsMigrados: 0,
    omitidos: 0,
    errores: []
  }

  // ═══════════════════════════════════════════════════
  // PASO 1: Migrar presupuestos globales
  // ═══════════════════════════════════════════════════
  for (const presupuesto of presupuestos) {
    try {
      // Si ya tiene UUID, omitir (ya está en Supabase)
      if (esUuidValido(presupuesto.id)) {
        resultado.omitidos++
        continue
      }

      // Si ya fue migrado (legacyId mapeado a UUID), omitir
      if (migrationStorageService.yaFueMigrado(presupuesto.id)) {
        resultado.omitidos++
        continue
      }

      // Resolver paciente_id
      let pacienteUuid = null
      if (presupuesto.pacienteId) {
        if (esUuidValido(presupuesto.pacienteId)) {
          pacienteUuid = presupuesto.pacienteId
        } else {
          // Intentar obtener UUID del mapa de migración
          pacienteUuid = migrationStorageService.obtenerSupabaseId(presupuesto.pacienteId)
          if (!pacienteUuid) {
            log.warn(`[migratePresupuestos] Presupuesto ${presupuesto.id} omitido: paciente ${presupuesto.pacienteId} no migrado aún`)
            resultado.omitidos++
            continue
          }
        }
      }

      // Transformar a formato Supabase
      const presupuestoSupabase = transformarPresupuestoParaSupabase(presupuesto, userId, pacienteUuid)

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('presupuestos')
        .insert(presupuestoSupabase)
        .select('id')
        .single()

      if (error) {
        resultado.errores.push({
          presupuestoId: presupuesto.id,
          folio: presupuesto.folio,
          error: error.message
        })
        continue
      }

      // Registrar mapeo legacyId → supabaseId
      migrationStorageService.registrarMapeo(presupuesto.id, data.id)
      resultado.migrados++

      // ═══════════════════════════════════════════════════
      // PASO 2: Migrar items de este presupuesto
      // ═══════════════════════════════════════════════════
      if (presupuesto.items && Array.isArray(presupuesto.items) && presupuesto.items.length > 0) {
        for (const item of presupuesto.items) {
          try {
            const itemSupabase = transformarItemParaSupabase(item, data.id, pacienteUuid)

            const { error: itemError } = await supabase
              .from('presupuesto_items')
              .insert(itemSupabase)

            if (itemError) {
              log.error(`[migratePresupuestos] Error al migrar item:`, itemError.message)
              continue
            }

            resultado.itemsMigrados++
          } catch (itemException) {
            log.error(`[migratePresupuestos] Excepción al migrar item:`, itemException.message)
          }
        }
      }
    } catch (error) {
      resultado.errores.push({
        presupuestoId: presupuesto.id,
        folio: presupuesto.folio,
        error: error.message
      })
    }
  }

  // ═══════════════════════════════════════════════════
  // PASO 3: Migrar items "huérfanos" (sin presupuesto global)
  // ═══════════════════════════════════════════════════
  // Estos son items que están en presupuesto_items_${pacienteId} pero no
  // tienen un presupuesto global asociado. Se migran sin presupuesto_id.
  log.info('[migratePresupuestos] Buscando items huérfanos...')
  
  // Obtener todos los pacientes migrados para buscar sus items
  const { data: pacientes } = await supabase
    .from('pacientes')
    .select('id')

  if (Array.isArray(pacientes)) {
    for (const paciente of pacientes) {
      try {
        // Buscar el legacyId de este paciente
        const legacyId = migrationStorageService.obtenerLegacyId(paciente.id)
        if (!legacyId) continue

        // Leer items de localStorage usando el legacyId
        const items = leerJSON(`presupuesto_items_${legacyId}`, [])
        if (!Array.isArray(items) || items.length === 0) continue

        log.info(`[migratePresupuestos] Migrando ${items.length} items huérfanos del paciente ${legacyId}...`)

        for (const item of items) {
          try {
            // Si el item ya tiene UUID, omitir
            if (esUuidValido(item.id)) continue

            const itemSupabase = transformarItemParaSupabase(item, null, paciente.id)

            const { error: itemError } = await supabase
              .from('presupuesto_items')
              .insert(itemSupabase)

            if (itemError) {
              log.error(`[migratePresupuestos] Error al migrar item huérfano:`, itemError.message)
              continue
            }

            resultado.itemsMigrados++
          } catch (itemException) {
            log.error(`[migratePresupuestos] Excepción al migrar item huérfano:`, itemException.message)
          }
        }
      } catch (pacienteException) {
        log.error(`[migratePresupuestos] Error procesando paciente ${paciente.id}:`, pacienteException.message)
      }
    }
  }

  return resultado
}

/**
 * Verifica si hay presupuestos pendientes de migrar.
 *
 * @returns {{total: number, pendientes: number, yaMigrados: number}}
 */
export const verificarPresupuestosPendientes = () => {
  const presupuestos = presupuestosStorageService.obtenerPresupuestos([])
  let yaMigrados = 0

  for (const presupuesto of presupuestos) {
    if (esUuidValido(presupuesto.id)) {
      yaMigrados++
      continue
    }
    if (migrationStorageService.yaFueMigrado(presupuesto.id)) {
      yaMigrados++
    }
  }

  return {
    total: presupuestos.length,
    pendientes: presupuestos.length - yaMigrados,
    yaMigrados
  }
}
