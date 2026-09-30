import { supabase, USE_SUPABASE, supabaseUrl } from '../../../services/supabaseClient'
import { certificadosStorageService } from './certificadosStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('papeleraCertificadosService')

const DIAS_RETENCION = 730
const MS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Calcula días transcurridos desde una fecha (ISO o Date)
 */
const diasTranscurridos = (fechaInput) => {
  if (!fechaInput) return null
  const fecha = fechaInput instanceof Date ? fechaInput : new Date(fechaInput)
  if (isNaN(fecha.getTime())) return null
  const diff = new Date().getTime() - fecha.getTime()
  return Math.floor(diff / MS_POR_DIA)
}

/**
 * Calcula días restantes hasta auto-purga (730 días desde eliminación)
 */
export const diasRestantes = (fechaEliminacion) => {
  const transcurridos = diasTranscurridos(fechaEliminacion)
  if (transcurridos === null) return null
  return Math.min(DIAS_RETENCION, Math.max(0, DIAS_RETENCION - transcurridos))
}

/**
 * Lista certificados en papelera de un paciente (eliminadoAt IS NOT NULL)
 */
export const obtenerCertificadosEliminados = (pacienteId) => {
  if (!pacienteId) return []
  const todos = certificadosStorageService.obtenerCertificados(pacienteId, [])
  return todos.filter(c => c.eliminadoAt)
}

/**
 * Lista certificados en papelera de TODOS los pacientes (admin)
 * Requiere fetch directo a Supabase (caché local es por-paciente)
 */
export const listarPapeleraGlobal = async () => {
  if (!USE_SUPABASE || !supabase) {
    log.warn('listarPapeleraGlobal: Supabase no disponible')
    return []
  }
  try {
    const { data, error } = await supabase
      .from('certificados')
      .select('*')
      .not('eliminado_at', 'is', null)
      .order('eliminado_at', { ascending: false })
    if (error) throw error
    return (data || []).map(transformarDesdeSupabase)
  } catch (e) {
    log.error('Error listando papelera global:', e.message)
    return []
  }
}

/**
 * Restaura un certificado (quita metadata de eliminación)
 * El trigger validar_eliminado_at_certificados validará que el caller sea admin
 */
export const restaurarCertificado = async (pacienteId, certId) => {
  const todos = certificadosStorageService.obtenerCertificados(pacienteId, [])
  const target = todos.find(c => String(c.id) === String(certId))

  if (!target || !target.eliminadoAt) {
    log.warn(`restaurarCertificado: cert ${certId} no encontrado o no está en papelera`)
    return false
  }

  const actualizados = todos.map(c =>
    String(c.id) === String(certId)
      ? { ...c, eliminadoAt: null, eliminadoPor: null, eliminadoMotivo: null }
      : c
  )

  const ok = await certificadosStorageService.guardarCertificados(pacienteId, actualizados)
  log.info(`[AUDITORÍA] Restauración de certificado: id=${certId}, tipo=${target.tipo}, paciente=${pacienteId}`)
  return ok !== false
}

/**
 * Elimina definitivamente un certificado.
 *
 * F7-37 v4 H-12 FIX: Usa arquitectura segura vía archivos-purge Edge Function
 * que garantiza:
 *   - Validación de sesión, tenant y rol (admin/dentista)
 *   - Validación de source_ids obligatorio (H-09)
 *   - Validación de UUID válido
 *   - Validación server-side de tenant + relación r2ArchivoId
 *   - R2-first DELETE (idempotente con 404)
 *   - RPC atómica (DELETE archivo + DELETE certificado en transacción)
 *
 * Caso especial: si el certificado NO tiene r2ArchivoId, se usa DELETE directo
 * como fallback (certificados sin archivo físico).
 *
 * @param {string} pacienteId - ID del paciente (para caché local)
 * @param {string} certId - ID del certificado a eliminar
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const eliminarDefinitivo = async (pacienteId, certId) => {
  const todos = certificadosStorageService.obtenerCertificados(pacienteId, [])
  const target = todos.find(c => String(c.id) === String(certId))

  if (!target) {
    log.warn(`eliminarDefinitivo: cert ${certId} no encontrado`)
    return false
  }

  if (!target.eliminadoAt) {
    log.warn(`eliminarDefinitivo: cert ${certId} no está en papelera`)
    return false
  }

  // ============================================================
  // H-12 FIX: Usar arquitectura segura (archivos-purge)
  // ============================================================
  if (target.r2ArchivoId) {
    // CASO A: Certificado con archivo físico → usar archivos-purge
    const ok = await eliminarViaArchivosPurge(target.r2ArchivoId, certId)
    if (!ok) {
      log.error(`eliminarDefinitivo: archivos-purge falló para cert ${certId}`)
      return false
    }
  } else if (USE_SUPABASE && supabase) {
    // CASO B: Certificado sin archivo físico → DELETE directo (fallback)
    try {
      const { error } = await supabase
        .from('certificados')
        .delete()
        .eq('id', certId)
      if (error) {
        log.error('Error eliminando certificado sin R2:', error.message)
        return false
      }
    } catch (e) {
      log.error('Excepción eliminando certificado sin R2:', e.message)
      return false
    }
  }

  // Quitar del caché local (solo si éxito)
  const actualizados = todos.filter(c => String(c.id) !== String(certId))
  const key = `certificados_${pacienteId}`
  try {
    const { pacientesStorageService } = await import('./pacientesStorageService')
    pacientesStorageService.guardarItem(key, actualizados)
  } catch (e) {
    log.warn('No se pudo actualizar caché local:', e.message)
  }

  log.info(`[AUDITORÍA] Eliminación definitiva vía archivos-purge: id=${certId}, tipo=${target.tipo}, paciente=${pacienteId}`)
  return true
}

/**
 * Llama a archivos-purge Edge Function con source_type='certificado'.
 *
 * @param {string} r2ArchivoId - ID del archivo en R2
 * @param {string} certId - ID del certificado
 * @returns {Promise<boolean>} true si fue purgado correctamente
 */
const eliminarViaArchivosPurge = async (r2ArchivoId, certId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log.error('eliminarViaArchivosPurge: no hay sesión activa')
      return false
    }

    if (!supabaseUrl) {
      log.error('eliminarViaArchivosPurge: supabaseUrl no configurado')
      return false
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/archivos-purge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        archivo_ids: [r2ArchivoId],
        source_type: 'certificado',
        source_ids: { [r2ArchivoId]: certId },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown')
      log.error(`archivos-purge HTTP ${response.status}: ${errorText}`)
      return false
    }

    const result = await response.json()

    if (!result.success) {
      log.error(`archivos-purge respondió success=false: ${JSON.stringify(result)}`)
      return false
    }

    if (!Array.isArray(result.purgados) || !result.purgados.includes(r2ArchivoId)) {
      const rechazado = Array.isArray(result.rechazados)
        ? result.rechazados.find(r => r.id === r2ArchivoId)
        : null
      log.error(`archivos-purge no purgó ${r2ArchivoId}: ${rechazado?.razon || 'desconocido'}`)
      return false
    }

    return true
  } catch (e) {
    log.error('Excepción en eliminarViaArchivosPurge:', e.message)
    return false
  }
}

/**
 * Vacía la papelera de un paciente (elimina definitivamente todos los certificados)
 * @returns {Promise<number>} cantidad eliminada
 */
export const vaciarPapelera = async (pacienteId) => {
  const eliminados = obtenerCertificadosEliminados(pacienteId)
  if (eliminados.length === 0) return 0

  const resultados = await Promise.all(
    eliminados.map(c => eliminarDefinitivo(pacienteId, c.id))
  )
  return resultados.filter(Boolean).length
}

/**
 * Transforma fila de Supabase a objeto de dominio
 */
const transformarDesdeSupabase = (fila) => {
  if (!fila) return null
  const datos = fila.datos || {}
  return {
    id: fila.id,
    pacienteId: fila.paciente_id,
    fechaEmision: fila.fecha_emision,
    tipo: fila.tipo,
    ...datos,
    eliminadoAt: fila.eliminado_at,
    eliminadoPor: fila.eliminado_por,
    eliminadoMotivo: fila.eliminado_motivo
  }
}
