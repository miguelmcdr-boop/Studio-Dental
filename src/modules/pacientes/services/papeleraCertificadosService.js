import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { certificadosStorageService } from './certificadosStorageService'
import { eliminaArchivo } from '../../../services/r2ArchivosService'
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
 * Elimina definitivamente un certificado (borra R2 + Supabase + localStorage)
 */
export const eliminarDefinitivo = async (pacienteId, certId) => {
  const todos = certificadosStorageService.obtenerCertificados(pacienteId, [])
  const target = todos.find(c => String(c.id) === String(certId))
  if (!target) {
    log.warn(`eliminarDefinitivo: cert ${certId} no encontrado`)
    return false
  }

  // 1. Borrar PDF de R2 si existe
  if (target.r2ArchivoId) {
    const okR2 = await eliminaArchivo(target.r2ArchivoId)
    if (!okR2) {
      log.warn(`eliminarDefinitivo: no se pudo borrar R2 de ${certId}, continuando con metadata`)
    }
  }

  // 2. DELETE en Supabase (si aplica)
  if (USE_SUPABASE && supabase) {
    try {
      const { error } = await supabase
        .from('certificados')
        .delete()
        .eq('id', certId)
      if (error) {
        log.error('Error eliminando certificado de Supabase:', error.message)
        return false
      }
    } catch (e) {
      log.error('Excepción eliminando de Supabase:', e.message)
      return false
    }
  }

  // 3. Quitar del caché local
  const actualizados = todos.filter(c => String(c.id) !== String(certId))
  const key = `certificados_${pacienteId}`
  try {
    const { pacientesStorageService } = await import('./pacientesStorageService')
    pacientesStorageService.guardarItem(key, actualizados)
  } catch (e) {
    log.warn('No se pudo actualizar caché local:', e.message)
  }

  log.info(`[AUDITORÍA] Eliminación definitiva: id=${certId}, tipo=${target.tipo}, paciente=${pacienteId}`)
  return true
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
