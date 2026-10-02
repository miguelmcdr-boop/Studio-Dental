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

export interface ResultadoConflicto<T = Record<string, unknown>> {
  hayConflicto: boolean
  versionRemota: T | null
  updatedAtRemoto: string | null
}

export type EstrategiaResolucion = 'last_write_wins' | 'manual_local' | 'manual_remote' | 'auto' | string

export interface LogEntryAuditoria {
  user_id: string
  table_name: string
  record_id: string
  action: string
  old_data: unknown
  new_data: unknown
  resolution_strategy: EstrategiaResolucion | null
  user_email: string | undefined
}

/**
 * Detecta si hay conflicto entre versión local y remota.
 *
 * @param tabla - Nombre de la tabla
 * @param recordId - ID del registro
 * @param updatedAtLocal - Timestamp de la versión local (ISO string o ms)
 * @returns {hayConflicto, versionRemota, updatedAtRemoto}
 */
export const detectarConflicto = async <T extends { updated_at?: string } = Record<string, unknown> & { updated_at?: string }>(
  tabla: string,
  recordId: string | number,
  updatedAtLocal?: string | number | null
): Promise<ResultadoConflicto<T>> => {
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

    const updatedAtRemoto: string | null = (data as T).updated_at || null
    if (!updatedAtRemoto || !updatedAtLocal) {
      return { hayConflicto: false, versionRemota: data as T, updatedAtRemoto }
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
      versionRemota: data as T,
      updatedAtRemoto
    }
  } catch (e: unknown) {
    log.error(`[conflictDetection] Error inesperado en ${tabla}:`, e)
    return { hayConflicto: false, versionRemota: null, updatedAtRemoto: null }
  }
}

/**
 * Registra una entrada en la tabla audit_log.
 * Falla silenciosamente si hay error (no rompe flujo principal).
 */
export const registrarAuditoria = async (
  tabla: string,
  recordId: string | number,
  accion: string,
  oldData: unknown = null,
  newData: unknown = null,
  estrategia: EstrategiaResolucion | null = null
): Promise<void> => {
  if (!USE_SUPABASE || !supabase) {
    return
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      log.warn('[conflictDetection] No hay usuario autenticado para auditoría')
      return
    }

    const logEntry: LogEntryAuditoria = {
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
  } catch (e: unknown) {
    log.error('[conflictDetection] Error inesperado en auditoría:', e)
  }
}

/**
 * Aplica la resolución del conflicto según la decisión del usuario.
 */
export const resolverConflicto = async <T>(
  tabla: string,
  recordId: string | number,
  decision: 'local' | 'remote',
  datosLocales: T,
  datosRemotos: T
): Promise<T> => {
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
