import { pacientesStorageService } from './pacientesStorageService'
import { obtenerDatoClinico, guardarCertificado } from '../../../services/datosClinicosSupabase'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { createLogger } from '../../../services/logger'

const log = createLogger('certificadosStorageService')

export interface CertificadoMedico {
  id?: string | number
  fechaEmision?: string
  fecha_emision?: string
  tipo?: string
  fechaAtencion?: string
  horaInicio?: string
  horaFin?: string
  diasReposo?: number | string
  diagnosticoMotivo?: string
  observaciones?: string
  profesional?: string
  rutProfesional?: string
  especialidad?: string
  datos?: Record<string, unknown>
  [key: string]: unknown
}

export interface CertificadosStorageServiceAPI {
  obtenerCertificados: (pacienteId: string | number, fallback?: CertificadoMedico[]) => CertificadoMedico[]
  guardarCertificados: (pacienteId: string | number, certificados: CertificadoMedico[]) => Promise<boolean>
  eliminarCertificadosDePaciente: (pacienteId: string | number) => void
}

/**
 * Servicio de Persistencia de Certificados Médicos (F6-D-6)
 * 
 * Estrategia: Supabase como fuente de verdad, localStorage como caché offline
 * 
 * Transformación bidireccional:
 * - Local: { id, fechaEmision, tipo, fechaAtencion, horaInicio, horaFin, diasReposo, diagnosticoMotivo, observaciones, profesional, rutProfesional, especialidad }
 * - Supabase: { id, fecha_emision, tipo, datos: JSONB }
 */
export const certificadosStorageService: CertificadosStorageServiceAPI = {
  /**
   * Obtiene certificados desde Supabase con fallback a localStorage
   */
  obtenerCertificados: (pacienteId: string | number, fallback: CertificadoMedico[] = []): CertificadoMedico[] => {
    if (!pacienteId) return fallback

    // 1. Intentar desde caché de Supabase primero (ya transformado)
    const datoSupabase = obtenerDatoClinico(String(pacienteId), 'certificados', null)
    if (datoSupabase !== null && Array.isArray(datoSupabase)) {
      return datoSupabase as CertificadoMedico[]
    }

    // 2. Fallback a localStorage
    const certsLS = pacientesStorageService.obtenerItem<CertificadoMedico[]>(`certificados_${pacienteId}`, fallback)
    return Array.isArray(certsLS) ? certsLS : fallback
  },

  /**
   * Guarda certificados en Supabase + localStorage (localStorage primero)
   */
  guardarCertificados: async (pacienteId: string | number, certificados: CertificadoMedico[]): Promise<boolean> => {
    if (!pacienteId) return false
    if (!Array.isArray(certificados)) return false

    // F6-D-6: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = Boolean(pacientesStorageService.guardarItem(`certificados_${pacienteId}`, certificados))

    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      const promesas = certificados.map(async (cert: CertificadoMedico) => {
        const certSupabase: CertificadoMedico = { ...cert }
        // Solo incluir el ID si es UUID válido de Supabase
        if (!esUuidValido(cert.id)) {
          delete certSupabase.id
        }
        return guardarCertificado(String(pacienteId), certSupabase)
      })
      await Promise.all(promesas)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('Error guardando certificados en Supabase:', msg)
    }

    return result
  },

  /**
   * Elimina certificados de un paciente (solo localStorage, F2-07d)
   */
  eliminarCertificadosDePaciente: (pacienteId: string | number): void => {
    if (!pacienteId) return
    pacientesStorageService.eliminarItem(`certificados_${pacienteId}`)
  }
}
