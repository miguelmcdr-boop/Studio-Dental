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
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { transformarDesdeSupabase } from './pacientesTransformations'

/**
 * Elimina un paciente (soft delete).
 * Marca deleted_at sin borrar datos; reversible por admin.
 *
 * @param {string} pacienteId — UUID del paciente
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const eliminarPaciente = async (pacienteId) => {
  if (!pacienteId) return false

  if (!USE_SUPABASE || !supabase) {
    console.warn('[pacientesSoftDelete] Supabase no configurado, no se puede eliminar')
    return false
  }

  try {
    const { error } = await supabase
      .from('pacientes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', pacienteId)
      .is('deleted_at', null)

    if (error) {
      console.error('[pacientesSoftDelete] Error al eliminar paciente:', error.message)
      return false
    }

    console.log(`[pacientesSoftDelete] Paciente ${pacienteId} marcado como eliminado (soft delete)`)
    return true
  } catch (e) {
    console.error('[pacientesSoftDelete] Excepción al eliminar paciente:', e)
    return false
  }
}

/**
 * Restaura un paciente eliminado (solo admin).
 * Quita la marca deleted_at; el paciente vuelve al directorio activo.
 *
 * @param {string} pacienteId — UUID del paciente
 * @returns {Promise<boolean>} true si se restauró correctamente
 */
export const restaurarPaciente = async (pacienteId) => {
  if (!pacienteId) return false

  if (!USE_SUPABASE || !supabase) {
    console.warn('[pacientesSoftDelete] Supabase no configurado, no se puede restaurar')
    return false
  }

  try {
    const { error } = await supabase
      .from('pacientes')
      .update({ deleted_at: null })
      .eq('id', pacienteId)
      .not('deleted_at', 'is', null)

    if (error) {
      console.error('[pacientesSoftDelete] Error al restaurar paciente:', error.message)
      return false
    }

    console.log(`[pacientesSoftDelete] Paciente ${pacienteId} restaurado`)
    return true
  } catch (e) {
    console.error('[pacientesSoftDelete] Excepción al restaurar paciente:', e)
    return false
  }
}

/**
 * Lista pacientes eliminados (papelera de reciclaje, solo admin).
 * Útil para UI de gestión de pacientes eliminados.
 *
 * @returns {Promise<Array>} Lista de pacientes eliminados (ordenados por fecha de eliminación)
 */
export const listarPacientesEliminados = async () => {
  if (!USE_SUPABASE || !supabase) {
    console.warn('[pacientesSoftDelete] Supabase no configurado, no se puede listar papelera')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('[pacientesSoftDelete] Error al listar eliminados:', error.message)
      return []
    }

    const eliminados = (data || []).map(transformarDesdeSupabase).filter(Boolean)
    console.log(`[pacientesSoftDelete] ${eliminados.length} pacientes en papelera`)
    return eliminados
  } catch (e) {
    console.error('[pacientesSoftDelete] Excepción al listar eliminados:', e)
    return []
  }
}

/**
 * Obtiene el email del usuario que eliminó cada paciente (batch).
 * Consulta audit_log por record_id y filtra por action='UPDATE' + cambio en deleted_at.
 * 
 * @param {Array<string>} pacienteIds - Lista de UUIDs de pacientes eliminados
 * @returns {Promise<Map<string, string>>} Mapa pacienteId → emailUsuario
 */
export const obtenerAutoresDeEliminacion = async (pacienteIds) => {
  if (!Array.isArray(pacienteIds) || pacienteIds.length === 0) {
    return new Map()
  }

  if (!USE_SUPABASE || !supabase) {
    console.warn('[pacientesSoftDelete] Supabase no configurado, no se pueden obtener autores')
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
      console.error('[pacientesSoftDelete] Error al obtener autores:', error.message)
      return new Map()
    }

    // Crear mapa pacienteId → emailUsuario (tomar el registro más reciente por paciente)
    const autoresMap = new Map()
    const registrosPorPaciente = new Map()

    for (const registro of data || []) {
      const pacienteId = registro.record_id
      if (!registrosPorPaciente.has(pacienteId)) {
        registrosPorPaciente.set(pacienteId, registro)
        autoresMap.set(pacienteId, registro.user_email)
      }
    }

    console.log(`[pacientesSoftDelete] Obtenidos ${autoresMap.size} autores de eliminación`)
    return autoresMap
  } catch (e) {
    console.error('[pacientesSoftDelete] Excepción al obtener autores:', e)
    return new Map()
  }
}
