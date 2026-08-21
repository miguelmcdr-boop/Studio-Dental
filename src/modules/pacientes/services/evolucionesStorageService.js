import { pacientesStorageService } from './pacientesStorageService'
import { obtenerDatoClinico, guardarEvolucionClinica } from '../../../services/datosClinicosSupabase'

/**
 * Servicio de Persistencia de Evoluciones Clínicas (F6-D-5)
 * 
 * Estrategia: Supabase como fuente de verdad, localStorage como caché offline
 * 
 * Transformación bidireccional:
 * - Local: { id, fecha: 'DD-MM-YYYY HH:MM', texto }
 * - Supabase: { id, fecha_hora: ISO string, texto, tipo: 'evolucion' }
 */

/**
 * Normaliza fecha/hora de múltiples formatos a ISO string
 * Maneja: 'DD-MM-YYYY HH:MM', 'DD/MM/YYYY HH:MM', ISO strings
 */
const normalizarFechaHora = (fecha) => {
  if (!fecha) return new Date().toISOString()
  
  // Si ya es ISO string válido, retornar tal cual
  if (typeof fecha === 'string' && fecha.includes('T') && fecha.includes('Z')) {
    return fecha
  }
  
  // Formato chileno: DD-MM-YYYY HH:MM o DD/MM/YYYY HH:MM
  const matchChile = fecha.match(/^(\d{2})[-/](\d{2})[-/](\d{4})\s+(\d{2}):(\d{2})$/)
  if (matchChile) {
    const [, dia, mes, anio, hora, minuto] = matchChile
    return `${anio}-${mes}-${dia}T${hora}:${minuto}:00.000Z`
  }
  
  // Si es un número (timestamp), convertir
  if (typeof fecha === 'number') {
    return new Date(fecha).toISOString()
  }
  
  // Fallback: intentar parsear como Date
  const parsed = new Date(fecha)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }
  
  // Último recurso: fecha actual
  return new Date().toISOString()
}

/**
 * Transforma evolución de formato Supabase a formato local
 */
const transformarDesdeSupabase = (evoSupabase) => ({
  id: evoSupabase.id,
  fecha: evoSupabase.fecha_hora,
  texto: evoSupabase.texto,
  tipo: evoSupabase.tipo || 'evolucion'
})

/**
 * Transforma evolución de formato local a formato Supabase
 */
const transformarHaciaSupabase = (evoLocal) => ({
  id: evoLocal.id,
  fecha_hora: normalizarFechaHora(evoLocal.fecha),
  texto: evoLocal.texto,
  tipo: evoLocal.tipo || 'evolucion'
})

/**
 * Valida si un ID es UUID válido
 */
const esUUIDValido = (id) => {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export const evolucionesStorageService = {
  /**
   * Obtiene evoluciones desde Supabase con fallback a localStorage
   */
  obtenerEvoluciones: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback

    // 1. Intentar desde caché de Supabase primero (ya transformado)
    const datoSupabase = obtenerDatoClinico(pacienteId, 'evoluciones_notas', null)
    if (datoSupabase !== null && Array.isArray(datoSupabase)) {
      return datoSupabase.map(transformarDesdeSupabase)
    }

    // 2. Fallback a localStorage
    const evosLS = pacientesStorageService.obtenerItem(`evoluciones_notas_${pacienteId}`, fallback)
    return Array.isArray(evosLS) ? evosLS : fallback
  },

  /**
   * Guarda evoluciones en Supabase + localStorage (localStorage primero)
   */
  guardarEvoluciones: async (pacienteId, evoluciones) => {
    if (!pacienteId) return false
    if (!Array.isArray(evoluciones)) return false

    // F6-D-5: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = pacientesStorageService.guardarItem(`evoluciones_notas_${pacienteId}`, evoluciones)

    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      const promesas = evoluciones.map(async (evo) => {
        const evoSupabase = transformarHaciaSupabase(evo)
        // Solo incluir el ID si es UUID válido de Supabase
        if (!esUUIDValido(evo.id)) {
          delete evoSupabase.id
        }
        return guardarEvolucionClinica(pacienteId, evoSupabase)
      })
      await Promise.all(promesas)
    } catch (e) {
      console.warn('[evolucionesStorageService] Error guardando evoluciones en Supabase:', e?.message)
    }

    return result
  },

  /**
   * Elimina evoluciones de un paciente (solo localStorage, F2-07d)
   */
  eliminarEvolucionesDePaciente: (pacienteId) => {
    if (!pacienteId) return
    pacientesStorageService.eliminarItem(`evoluciones_notas_${pacienteId}`)
  }
}
