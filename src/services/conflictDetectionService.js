/**
 * Servicio de detección y resolución de conflictos (F5-04).
 *
 * Detecta conflictos de edición cuando dos usuarios modifican el mismo
 * registro simultáneamente. Usa el campo updated_at como mecanismo de
 * detección (comparación de timestamps).
 *
 * API pública:
 * - detectarConflicto(tabla, recordId, updatedAtLocal) → { hayConflicto, versionRemota }
 * - registrarAuditoria(tabla, recordId, accion, oldData, newData, estrategia)
 * - resolverConflicto(tabla, recordId, decision, datos)
 *
 * Estrategias de resolución:
 * - last_write_wins: sobrescribe silenciosamente + log
 * - manual_local: usuario elige mantener su versión
 * - manual_remote: usuario elige usar versión remota
 */
import { supabase, USE_SUPABASE } from './supabaseClient'
import { createLogger } from './logger'

const log = createLogger('conflictDetectionService')

/**
 * Detecta si hay conflicto entre versión local y remota.
 *
 * @param {string} tabla - Nombre de la tabla
 * @param {string} recordId - ID del registro
 * @param {string|number} updatedAtLocal - Timestamp de la versión local (ISO string o ms)
 * @returns {Promise<{hayConflicto: boolean, versionRemota: object|null, updatedAtRemoto: string|null}>}
 */
export const detectarConflicto = async (tabla, recordId, updatedAtLocal) => {
  if (!USE_SUPABASE || !supabase) {
    return { hayConflicto: false, versionRemota: null, updatedAtRemoto: null }
  }

  try {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .eq('id', recordId)
      .maybeSingle()

    if (error) {
      log.error(`[conflictDetection] Error consultando ${tabla}:`, error)
      return { hayConflicto: false, versionRemota: null, updatedAtRemoto: null }
    }

    if (!data) {
      // El registro no existe remotamente (puede ser nuevo o eliminado)
      return { hayConflicto: false, versionRemota: null, updatedAtRemoto: null }
    }

    const updatedAtRemoto = data.updated_at
    if (!updatedAtRemoto || !updatedAtLocal) {
      return { hayConflicto: false, versionRemota: data, updatedAtRemoto }
    }

    // Normalizar a timestamps numéricos para comparar
    const localMs = typeof updatedAtLocal === 'number'
      ? updatedAtLocal
      : new Date(updatedAtLocal).getTime()
    const remotoMs = new Date(updatedAtRemoto).getTime()

    // Hay conflicto si el remoto es más reciente que el local
    // Tolerancia de 1 segundo para evitar falsos positivos por latencia
    const hayConflicto = (remotoMs - localMs) > 1000

    return {
      hayConflicto,
      versionRemota: data,
      updatedAtRemoto
    }
  } catch (e) {
    log.error(`[conflictDetection] Error inesperado en ${tabla}:`, e)
    return { hayConflicto: false, versionRemota: null, updatedAtRemoto: null }
  }
}

/**
 * Registra una entrada en la tabla audit_log.
 * Falla silenciosamente si hay error (no rompe flujo principal).
 *
 * @param {string} tabla - Nombre de la tabla
 * @param {string} recordId - ID del registro
 * @param {string} accion - Tipo de acción: INSERT, UPDATE, DELETE, CONFLICT_RESOLVED
 * @param {object|null} oldData - Datos anteriores (para UPDATE/DELETE)
 * @param {object|null} newData - Datos nuevos (para INSERT/UPDATE)
 * @param {string|null} estrategia - last_write_wins, manual_local, manual_remote, auto
 */
export const registrarAuditoria = async (tabla, recordId, accion, oldData = null, newData = null, estrategia = null) => {
  if (!USE_SUPABASE || !supabase) {
    return
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      log.warn('[conflictDetection] No hay usuario autenticado para auditoría')
      return
    }

    const logEntry = {
      user_id: user.id,
      table_name: tabla,
      record_id: String(recordId),
      action: accion,
      old_data: oldData,
      new_data: newData,
      resolution_strategy: estrategia,
      user_email: user.email
    }

    const { error } = await supabase
      .from('audit_log')
      .insert(logEntry)

    if (error) {
      log.error('[conflictDetection] Error registrando auditoría:', error)
    }
  } catch (e) {
    log.error('[conflictDetection] Error inesperado en auditoría:', e)
  }
}

/**
 * Aplica la resolución del conflicto según la decisión del usuario.
 *
 * @param {string} tabla - Nombre de la tabla
 * @param {string} recordId - ID del registro
 * @param {'local'|'remote'} decision - Decisión del usuario
 * @param {object} datosLocales - Datos locales del usuario
 * @param {object} datosRemotos - Datos remotos de Supabase
 * @returns {Promise<object>} Datos finales a usar
 */
export const resolverConflicto = async (tabla, recordId, decision, datosLocales, datosRemotos) => {
  const estrategia = decision === 'local' ? 'manual_local' : 'manual_remote'
  const datosFinales = decision === 'local' ? datosLocales : datosRemotos

  await registrarAuditoria(
    tabla,
    recordId,
    'CONFLICT_RESOLVED',
    datosLocales,
    datosRemotos,
    estrategia
  )

  return datosFinales
}

/**
 * Servicio exportado como objeto para consistencia.
 */
export const conflictDetectionService = {
  detectarConflicto,
  registrarAuditoria,
  resolverConflicto
}
