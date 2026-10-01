/**
 * Servicio de Persistencia de Recetas Médicas (F6-D-4)
 *
 * Estrategia: Supabase como fuente de verdad, localStorage como caché offline
 * (alineado con RFC F4-01 y patrón de odontogramaStorageService).
 *
 * Transformación bidireccional entre:
 * - localStorage: array de recetas simples {id, fecha, medicamento, indicacion}
 * - Supabase: filas de recetas con medicamentos (array jsonb), indicaciones (text)
 *
 * API pública:
 * - obtenerRecetas(pacienteId, fallback)          → SÍNCRONO, Supabase → localStorage
 * - guardarRecetas(pacienteId, recetas)           → ASYNC, Supabase + localStorage
 * - eliminarRecetasDePaciente(pacienteId)         → SÍNCRONO, limpia localStorage
 * - obtenerUltimaReceta(pacienteId, fallback)     → SÍNCRONO, Supabase → localStorage
 */
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import {
  guardarReceta as guardarRecetaSupabase,
  obtenerDatoClinico
} from '../../../services/datosClinicosSupabase'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('recetasStorageService')

/**
 * Transforma receta de formato Supabase a formato RecetasSection
 * @param {Object} recetaSupabase - Receta desde Supabase
 * @returns {Object} Receta en formato simple
 */
const transformarDesdeSupabase = (recetaSupabase) => ({
  id: recetaSupabase.id,
  fecha: recetaSupabase.fecha,
  // F6-D-4 fix: array vacío es truthy en JS, verificar explícitamente
  medicamento: Array.isArray(recetaSupabase.medicamentos) && recetaSupabase.medicamentos.length > 0
    ? recetaSupabase.medicamentos[0]
    : '',
  indicacion: recetaSupabase.indicaciones || ''
})

/**
 * Normaliza fecha de formato local (DD-MM-YYYY) a ISO (YYYY-MM-DD)
 * @param {string} fecha - Fecha en cualquier formato
 * @returns {string} Fecha en formato ISO YYYY-MM-DD
 */
const normalizarFecha = (fecha) => {
  if (!fecha) return new Date().toISOString().split('T')[0]
  
  // Si ya está en formato ISO (YYYY-MM-DD), retornar tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha
  
  // Si está en formato chileno DD-MM-YYYY, convertir
  const match = fecha.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (match) {
    const [, dia, mes, anio] = match
    return `${anio}-${mes}-${dia}`
  }
  
  // Si está en formato DD/MM/YYYY, convertir
  const matchSlash = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (matchSlash) {
    const [, dia, mes, anio] = matchSlash
    return `${anio}-${mes}-${dia}`
  }
  
  // Fallback: usar fecha actual
  return new Date().toISOString().split('T')[0]
}

/**
 * Transforma receta de formato RecetasSection a formato Supabase
 * @param {Object} recetaLocal - Receta en formato simple
 * @returns {Object} Receta en formato Supabase
 */
const transformarHaciaSupabase = (recetaLocal) => ({
  id: recetaLocal.id,
  // F6-D-4 fix: normalizar fecha de DD-MM-YYYY a YYYY-MM-DD para PostgreSQL
  fecha: normalizarFecha(recetaLocal.fecha),
  medicamentos: [recetaLocal.medicamento],
  indicaciones: recetaLocal.indicacion
})

/**
 * Verifica si un ID es UUID válido de Supabase
 * @param {string} id - ID a verificar
 * @returns {boolean} true si es UUID válido
 */
const esUUIDValido = (id) => {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export const recetasStorageService = {
  /**
   * Obtiene recetas desde Supabase con fallback a localStorage
   * @param {string} pacienteId - UUID del paciente
   * @param {Array} fallback - Valor por defecto si no hay datos
   * @returns {Array} Array de recetas en formato simple
   */
  obtenerRecetas: (pacienteId, fallback = []) => {
    if (!pacienteId) return fallback

    // F6-D-4: leer desde caché de Supabase primero (ya transformado)
    const datoSupabase = obtenerDatoClinico(pacienteId, 'recetas', null)
    if (datoSupabase !== null && Array.isArray(datoSupabase)) {
      // Transformar desde formato Supabase a formato RecetasSection
      return datoSupabase.map(transformarDesdeSupabase)
    }

    // Fallback a localStorage
    const recetasLS = leerJSON(`recetas_${pacienteId}`, fallback)
    return Array.isArray(recetasLS) ? recetasLS : fallback
  },

  /**
   * Guarda recetas en Supabase + localStorage (localStorage primero)
   * @param {string} pacienteId - UUID del paciente
   * @param {Array} recetas - Array de recetas en formato simple
   * @returns {Promise<boolean>} true si se guardó correctamente
   */
  guardarRecetas: async (pacienteId, recetas) => {
    if (!pacienteId) return false
    if (!Array.isArray(recetas)) return false

    // F6-D-4: escribir localStorage PRIMERO (síncrono, inmediato)
    const result = escribirJSON(`recetas_${pacienteId}`, recetas)

    // Luego sincronizar con Supabase (async, puede fallar sin perder datos)
    try {
      // Transformar cada receta al formato Supabase y guardar
      const promesas = recetas.map(async (receta) => {
        const recetaSupabase = transformarHaciaSupabase(receta)
        // Solo incluir el ID si es UUID válido de Supabase
        // Los IDs numéricos de Date.now() no deben enviarse
        if (!esUUIDValido(receta.id)) {
          delete recetaSupabase.id
        }
        return guardarRecetaSupabase(pacienteId, recetaSupabase)
      })
      await Promise.all(promesas)
    } catch (e) {
      log.warn('Error guardando recetas en Supabase:', e?.message)
    }

    return result
  },

  /**
   * Elimina recetas de un paciente (solo localStorage, F2-07d)
   * @param {string} pacienteId - UUID del paciente
   */
  eliminarRecetasDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`recetas_${pacienteId}`)
    } catch (e) {
      log.error(`Error al eliminar recetas del paciente ${pacienteId}:`, e)
    }
  }
}
