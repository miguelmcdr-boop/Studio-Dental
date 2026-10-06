/**
 * Servicio de soft delete de pacientes (F6-F).
 *
 * Extraído de pacientesStorageService.js para respetar el límite
 * arquitectónico de 450 líneas. Los métodos aquí gestionan el ciclo
 * de vida del paciente: eliminación reversible y papelera de reciclaje.
 *
 * Estrategia: UPDATE deleted_at en lugar de DELETE real.
 * - Pacientes eliminados quedan ocultos (deleted_at IS NOT NULL)
 * - Admin puede restaurarlos (papelera de reciclaje)
 * - Quedan auditados automáticamente por trigger trg_pacientes_audit
 *
 * Dependencia: pacientesStorageService.js re-exporta estos métodos
 * en su API pública para mantener compatibilidad con consumidores existentes.
 */
import { supabase, USE_SUPABASE } from '../../../../infrastructure/supabase/supabaseClient'
import { transformarDesdeSupabase } from './pacientesTransformations'
import { createLogger } from '../../../../infrastructure/logging/logger'
import type { Paciente } from '../schemas/pacienteSchema'

const log = createLogger('pacientesSoftDeleteService')

export interface PurgeRechazado {
  id: string
  razon?: string
  [key: string]: unknown
}

export interface PurgeResult {
  purgados: string[]
  rechazados: PurgeRechazado[]
  error?: string
}

export interface AuditLogItem {
  record_id: string
  user_email: string
  created_at: string
}

/**
 * Elimina un paciente (soft delete).
 * Marca deleted_at sin borrar datos; reversible por admin.
 *
 * @param pacienteId — UUID del paciente
 * @returns true si se eliminó correctamente
 */
export const eliminarPaciente = async (pacienteId: string | number | null | undefined): Promise<boolean> => {
  if (!pacienteId) return false

  if (!USE_SUPABASE || !supabase) {
    log.warn('[pacientesSoftDelete] Supabase no configurado, no se puede eliminar')
    return false
  }

  try {
    const { error } = await supabase
      .from('pacientes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', String(pacienteId))
      .is('deleted_at', null)

    if (error) {
      log.error('[pacientesSoftDelete] Error al eliminar paciente:', error.message)
      return false
    }

    log.info(`[pacientesSoftDelete] Paciente ${pacienteId} marcado como eliminado (soft delete)`)
    return true
  } catch (e: unknown) {
    log.error('[pacientesSoftDelete] Excepción al eliminar paciente:', e)
    return false
  }
}

/**
 * Restaura un paciente eliminado (solo admin).
 * Quita la marca deleted_at; el paciente vuelve al directorio activo.
 *
 * @param pacienteId — UUID del paciente
 * @returns true si se restauró correctamente
 */
export const restaurarPaciente = async (pacienteId: string | number | null | undefined): Promise<boolean> => {
  if (!pacienteId) return false

  if (!USE_SUPABASE || !supabase) {
    log.warn('[pacientesSoftDelete] Supabase no configurado, no se puede restaurar')
    return false
  }

  try {
    const { error } = await supabase
      .from('pacientes')
      .update({ deleted_at: null })
      .eq('id', String(pacienteId))
      .not('deleted_at', 'is', null)

    if (error) {
      log.error('[pacientesSoftDelete] Error al restaurar paciente:', error.message)
      return false
    }

    log.info(`[pacientesSoftDelete] Paciente ${pacienteId} restaurado`)
    return true
  } catch (e: unknown) {
    log.error('[pacientesSoftDelete] Excepción al restaurar paciente:', e)
    return false
  }
}

/**
 * Lista pacientes eliminados (papelera de reciclaje, solo admin).
 * Útil para UI de gestión de pacientes eliminados.
 *
 * @returns Lista de pacientes eliminados (ordenados por fecha de eliminación)
 */
export const listarPacientesEliminados = async (): Promise<Paciente[]> => {
  if (!USE_SUPABASE || !supabase) {
    log.warn('[pacientesSoftDelete] Supabase no configurado, no se puede listar papelera')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      log.error('[pacientesSoftDelete] Error al listar eliminados:', error.message)
      return []
    }

    const eliminados: Paciente[] = (data || [])
      .map((row: Record<string, unknown>) => transformarDesdeSupabase<Paciente>(row))
      .filter((p): p is Paciente => p !== null)

    log.info(`[pacientesSoftDelete] ${eliminados.length} pacientes en papelera`)
    return eliminados
  } catch (e: unknown) {
    log.error('[pacientesSoftDelete] Excepción al listar eliminados:', e)
    return []
  }
}

/**
 * Obtiene el email del usuario que eliminó cada paciente (batch).
 * Consulta audit_log por record_id y filtra por action='UPDATE' + cambio en deleted_at.
 * 
 * @param pacienteIds - Lista de UUIDs de pacientes eliminados
 * @returns Mapa pacienteId → emailUsuario
 */
export const obtenerAutoresDeEliminacion = async (pacienteIds: string[]): Promise<Map<string, string>> => {
  if (!Array.isArray(pacienteIds) || pacienteIds.length === 0) {
    return new Map()
  }

  if (!USE_SUPABASE || !supabase) {
    log.warn('[pacientesSoftDelete] Supabase no configurado, no se pueden obtener autores')
    return new Map()
  }

  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('record_id, user_email, created_at')
      .eq('table_name', 'pacientes')
      .eq('action', 'UPDATE')
      .like('new_data', '%deleted_at%')
      .in('record_id', pacienteIds)
      .order('created_at', { ascending: false })

    if (error) {
      log.error('[pacientesSoftDelete] Error al obtener autores:', error.message)
      return new Map()
    }

    // Crear mapa pacienteId → emailUsuario (tomar el registro más reciente por paciente)
    const autoresMap = new Map<string, string>()
    const registrosPorPaciente = new Map<string, AuditLogItem>()

    for (const registro of (data || []) as AuditLogItem[]) {
      const pacienteId = registro.record_id
      if (!registrosPorPaciente.has(pacienteId)) {
        registrosPorPaciente.set(pacienteId, registro)
        autoresMap.set(pacienteId, registro.user_email)
      }
    }

    log.info(`[pacientesSoftDelete] Obtenidos ${autoresMap.size} autores de eliminación`)
    return autoresMap
  } catch (e: unknown) {
    log.error('[pacientesSoftDelete] Excepción al obtener autores:', e)
    return new Map()
  }
}

/**
 * Purga pacientes en papelera de forma permanente (Feature 1).
 *
 * Llama a Edge Function pacientes-purge que:
 * - Valida rol admin + multi-tenant
 * - Verifica retención legal (10 años desde eliminación)
 * - Elimina blobs R2 + DELETE en cascada
 * - Registra ADMIN_PURGE_PACIENTES en audit_log
 *
 * @param pacienteIds - Lista de UUIDs a purgar
 * @returns { purgados: [...], rechazados: [{id, razon}] }
 */
export const vaciarPapeleraPacientes = async (pacienteIds: string[]): Promise<PurgeResult> => {
  if (!Array.isArray(pacienteIds) || pacienteIds.length === 0) {
    log.warn('[pacientesSoftDelete] vaciarPapeleraPacientes: lista vacía')
    return { purgados: [], rechazados: [] }
  }

  if (!USE_SUPABASE || !supabase) {
    log.warn('[pacientesSoftDelete] Supabase no configurado, no se puede purgar')
    return { purgados: [], rechazados: [] }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log.error('[pacientesSoftDelete] No hay sesión activa para purgar')
      return { purgados: [], rechazados: [] }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/pacientes-purge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ paciente_ids: pacienteIds }),
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string }
      log.error('[pacientesSoftDelete] Error en pacientes-purge:', errorData)
      return { purgados: [], rechazados: [], error: errorData.error || 'Error desconocido' }
    }

    const data = (await response.json()) as { purgados?: string[]; rechazados?: PurgeRechazado[] }
    log.info(`[pacientesSoftDelete] Purga completada: ${(data.purgados || []).length} purgados, ${(data.rechazados || []).length} rechazados`)
    return {
      purgados: data.purgados || [],
      rechazados: data.rechazados || [],
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('[pacientesSoftDelete] Excepción al purgar pacientes:', e)
    return { purgados: [], rechazados: [], error: msg }
  }
}
