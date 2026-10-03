import { supabase, USE_SUPABASE, supabaseUrl } from '../../../services/supabaseClient'
import { certificadosStorageService, type CertificadoMedico } from './certificadosStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('papeleraCertificadosService')

export const DIAS_RETENCION = 730
export const MS_POR_DIA = 24 * 60 * 60 * 1000

export interface CertificadoPapelera extends CertificadoMedico {
  id: string | number
  pacienteId?: string | number
  fechaEmision?: string
  tipo?: string
  r2ArchivoId?: string
  eliminadoAt?: string | null
  eliminadoPor?: string | null
  eliminadoMotivo?: string | null
  [key: string]: unknown
}

interface CertificadoSupabaseRow {
  id: string | number
  paciente_id: string | number
  fecha_emision?: string
  tipo?: string
  datos?: Record<string, unknown>
  eliminado_at?: string | null
  eliminado_por?: string | null
  eliminado_motivo?: string | null
  [key: string]: unknown
}

interface ArchivosPurgeResponse {
  success: boolean
  purgados?: string[]
  rechazados?: Array<{ id: string; razon?: string }>
  [key: string]: unknown
}

/**
 * Calcula días transcurridos desde una fecha (ISO o Date)
 */
const diasTranscurridos = (fechaInput?: string | Date | null): number | null => {
  if (!fechaInput) return null
  const fecha = fechaInput instanceof Date ? fechaInput : new Date(fechaInput)
  if (isNaN(fecha.getTime())) return null
  const diff = new Date().getTime() - fecha.getTime()
  return Math.floor(diff / MS_POR_DIA)
}

/**
 * Calcula días restantes hasta auto-purga (730 días desde eliminación)
 */
export const diasRestantes = (fechaEliminacion?: string | Date | null): number | null => {
  const transcurridos = diasTranscurridos(fechaEliminacion)
  if (transcurridos === null) return null
  return Math.min(DIAS_RETENCION, Math.max(0, DIAS_RETENCION - transcurridos))
}

/**
 * Lista certificados en papelera de un paciente (eliminadoAt IS NOT NULL)
 */
export const obtenerCertificadosEliminados = (pacienteId?: string | number | null): CertificadoPapelera[] => {
  if (!pacienteId) return []
  const todos = certificadosStorageService.obtenerCertificados(pacienteId, []) as CertificadoPapelera[]
  return todos.filter(c => Boolean(c.eliminadoAt))
}

/**
 * Transforma fila de Supabase a objeto de dominio
 */
const transformarDesdeSupabase = (fila?: CertificadoSupabaseRow | null): CertificadoPapelera | null => {
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

/**
 * Lista certificados en papelera de TODOS los pacientes (admin)
 * Requiere fetch directo a Supabase (caché local es por-paciente)
 */
export const listarPapeleraGlobal = async (): Promise<CertificadoPapelera[]> => {
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
    return (data || []).map((row: CertificadoSupabaseRow) => transformarDesdeSupabase(row)).filter((c): c is CertificadoPapelera => Boolean(c))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('Error listando papelera global:', msg)
    return []
  }
}

/**
 * Restaura un certificado (quita metadata de eliminación)
 * El trigger validar_eliminado_at_certificados validará que el caller sea admin
 */
export const restaurarCertificado = async (
  pacienteId: string | number,
  certId: string | number
): Promise<boolean> => {
  const todos = certificadosStorageService.obtenerCertificados(pacienteId, []) as CertificadoPapelera[]
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
 * Llama a archivos-purge Edge Function con source_type='certificado'.
 *
 * @param r2ArchivoId - ID del archivo en R2
 * @param certId - ID del certificado
 * @returns true si fue purgado correctamente
 */
const eliminarViaArchivosPurge = async (
  r2ArchivoId: string,
  certId: string | number
): Promise<boolean> => {
  try {
    if (!supabase) {
      log.error('eliminarViaArchivosPurge: Supabase no disponible')
      return false
    }
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

    const result = (await response.json()) as ArchivosPurgeResponse

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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('Excepción en eliminarViaArchivosPurge:', msg)
    return false
  }
}

/**
 * Elimina un certificado SIN archivo físico vía archivos-purge Edge Function.
 * F7-37 v5 H-12: Unifica el flujo manual con el automático.
 *
 * @param certId - ID del certificado a eliminar
 * @returns true si fue eliminado correctamente
 */
const eliminarCertificadoSinArchivo = async (certId: string | number): Promise<boolean> => {
  try {
    if (!supabase) {
      log.error('eliminarCertificadoSinArchivo: Supabase no disponible')
      return false
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log.error('eliminarCertificadoSinArchivo: no hay sesión activa')
      return false
    }

    if (!supabaseUrl) {
      log.error('eliminarCertificadoSinArchivo: supabaseUrl no configurado')
      return false
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/archivos-purge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        archivo_ids: [],
        source_type: 'certificado',
        certificado_id: certId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown')
      log.error(`archivos-purge HTTP ${response.status}: ${errorText}`)
      return false
    }

    const result = (await response.json()) as ArchivosPurgeResponse

    if (!result.success) {
      log.error(`archivos-purge respondió success=false: ${JSON.stringify(result)}`)
      return false
    }

    if (!Array.isArray(result.purgados) || !result.purgados.includes(String(certId))) {
      const rechazado = Array.isArray(result.rechazados)
        ? result.rechazados.find(r => String(r.id) === String(certId))
        : null
      log.error(`archivos-purge no purgó certificado ${certId}: ${rechazado?.razon || 'desconocido'}`)
      return false
    }

    return true
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('Excepción en eliminarCertificadoSinArchivo:', msg)
    return false
  }
}

/**
 * Elimina definitivamente un certificado.
 *
 * F7-37 v4 H-12 FIX: Usa arquitectura segura vía archivos-purge Edge Function
 *
 * @param pacienteId - ID del paciente (para caché local)
 * @param certId - ID del certificado a eliminar
 * @returns true si se eliminó correctamente
 */
export const eliminarDefinitivo = async (
  pacienteId: string | number,
  certId: string | number
): Promise<boolean> => {
  const todos = certificadosStorageService.obtenerCertificados(pacienteId, []) as CertificadoPapelera[]
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
  } else {
    // ============================================================
    // CASO B: Certificado sin archivo físico → UNIFICADO vía archivos-purge
    // ============================================================
    const ok = await eliminarCertificadoSinArchivo(certId)
    if (!ok) {
      log.error(`eliminarDefinitivo: archivos-purge falló para certificado sin R2: ${certId}`)
      return false
    }
  }

  // Quitar del caché local (solo si éxito)
  const actualizados = todos.filter(c => String(c.id) !== String(certId))
  const key = `certificados_${pacienteId}`
  try {
    const { pacientesStorageService } = await import('./pacientesStorageService')
    pacientesStorageService.guardarItem(key, actualizados)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.warn('No se pudo actualizar caché local:', msg)
  }

  log.info(`[AUDITORÍA] Eliminación definitiva vía archivos-purge: id=${certId}, tipo=${target.tipo}, paciente=${pacienteId}`)
  return true
}

/**
 * Vacía la papelera de un paciente (elimina definitivamente todos los certificados)
 * @returns cantidad eliminada
 */
export const vaciarPapelera = async (pacienteId: string | number): Promise<number> => {
  const eliminados = obtenerCertificadosEliminados(pacienteId)
  if (eliminados.length === 0) return 0

  const resultados = await Promise.all(
    eliminados.map(c => eliminarDefinitivo(pacienteId, c.id))
  )
  return resultados.filter(Boolean).length
}
