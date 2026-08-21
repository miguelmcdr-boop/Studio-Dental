import { pacientesStorageService } from './pacientesStorageService'
import { obtenerDatoClinico, guardarCertificado } from '../../../services/datosClinicosSupabase'

/**
 * Servicio de Persistencia de Certificados Médicos (F6-D-6)
 * 
 * Estrategia: Supabase como fuente de verdad, localStorage como caché offline
 * 
 * Transformación bidireccional:
 * - Local: { id, fechaEmision, tipo, fechaAtencion, horaInicio, horaFin, diasReposo, diagnosticoMotivo, observaciones, profesional, rutProfesional, especialidad }
 * - Supabase: { id, fecha_emision, tipo, datos: JSONB }
 */

/**
 * Valida si un ID es UUID válido
 */
const esUUIDValido = (id) => {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export const certificadosStorageService = {
  /**
   * Obtiene certificados desde Supabase con fallback a localStorage
   */
  obtenerCertificados: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback

    // 1. Intentar desde caché de Supabase primero (ya transformado)
    const datoSupabase = obtenerDatoClinico(pacienteId, 'certificados', null)
    if (datoSupabase !== null && Array.isArray(datoSupabase)) {
      return datoSupabase
    }

    // 2. Fallback a localStorage
    const certsLS = pacientesStorageService.obtenerItem(`certificados_${pacienteId}`, fallback)
    return Array.isArray(certsLS) ? certsLS : fallback
  },

  /**
   * Guarda certificados en Supabase + localStorage (localStorage primero)
   */
  guardarCertificados: async (pacienteId, certificados) => {
    if (!pacienteId) return false
    if (!Array.isArray(certificados)) return false

    // F6-D-6: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = pacientesStorageService.guardarItem(`certificados_${pacienteId}`, certificados)

    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      const promesas = certificados.map(async (cert) => {
        const certSupabase = { ...cert }
        // Solo incluir el ID si es UUID válido de Supabase
        if (!esUUIDValido(cert.id)) {
          delete certSupabase.id
        }
        return guardarCertificado(pacienteId, certSupabase)
      })
      await Promise.all(promesas)
    } catch (e) {
      console.warn('[certificadosStorageService] Error guardando certificados en Supabase:', e?.message)
    }

    return result
  },

  /**
   * Elimina certificados de un paciente (solo localStorage, F2-07d)
   */
  eliminarCertificadosDePaciente: (pacienteId) => {
    if (!pacienteId) return
    pacientesStorageService.eliminarItem(`certificados_${pacienteId}`)
  }
}
