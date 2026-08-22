/**
 * Servicio de adjuntos clínicos en Supabase Storage (F6-E).
 *
 * Tarea MASTER_ROADMAP: F6-E — Adjuntos clínicos a Supabase Storage con URLs firmadas.
 *
 * Bucket privado: `adjuntos-clinicos`
 * Path: `{clinicaId}/{pacienteId}/{tipo}/{id}-{nombre}`
 * Políticas RLS: aisladas por `clinica_actual()` (F6-C).
 *
 * Estrategia de seguridad:
 * - NUNCA se usan URLs públicas.
 * - Toda descarga pasa por URL firmada con vida corta (1 hora por defecto).
 * - Si Supabase no está configurado, los métodos retornan null sin romper la app
 *   (estrategia offline-first: IndexedDB pasa a ser fuente primaria en ese caso).
 */
import { supabase, USE_SUPABASE } from './supabaseClient'

const BUCKET_ID = 'adjuntos-clinicos'
const DEFAULT_URL_TTL_SEGUNDOS = 3600 // 1 hora

/**
 * Genera un ID único para el archivo dentro del bucket.
 * Evita colisiones aunque dos archivos con el mismo nombre
 * se suban en el mismo milisegundo.
 */
const generarIdArchivo = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

/**
 * Construye el path del archivo en el bucket.
 * No se usa encodeURIComponent en los segmentos porque Supabase Storage
 * ya maneja caracteres especiales; solo sanitizamos el nombre para
 * evitar rutas rotas por `/` o `\`.
 */
const construirPath = ({ clinicaId, pacienteId, tipo, idArchivo, nombre }) => {
  const nombreSanitizado = (nombre || 'sin-nombre')
    .replace(/[/\\]/g, '_')
    .replace(/\s+/g, '-')
    .slice(0, 120)
  return `${clinicaId}/${pacienteId}/${tipo}/${idArchivo}-${nombreSanitizado}`
}

/**
 * Sube un adjunto a Supabase Storage.
 *
 * @param {Object} params
 * @param {string} params.clinicaId — UUID de la clínica (de userProfile)
 * @param {string} params.pacienteId — UUID del paciente
 * @param {string} params.tipo — 'foto' | 'rx' | 'consentimiento'
 * @param {Blob|File} params.blob — archivo binario
 * @param {string} params.nombre — nombre original del archivo
 * @returns {Promise<{path: string, publicUrl: null} | null>}
 *          path usado en el bucket (necesario para descarga y borrado);
 *          null si Supabase no está configurado o la subida falla.
 */
export const subirAdjunto = async ({ clinicaId, pacienteId, tipo, blob, nombre }) => {
  if (!USE_SUPABASE || !supabase) return null
  if (!clinicaId || !pacienteId || !tipo || !blob) {
    console.warn('[adjuntosSupabaseService] subirAdjunto: faltan parámetros obligatorios')
    return null
  }

  const idArchivo = generarIdArchivo()
  const path = construirPath({ clinicaId, pacienteId, tipo, idArchivo, nombre })
  const contentType = blob.type || 'application/octet-stream'

  try {
    const { error } = await supabase.storage
      .from(BUCKET_ID)
      .upload(path, blob, {
        contentType,
        upsert: false,
        cacheControl: '3600'
      })

    if (error) {
      console.error('[adjuntosSupabaseService] Error subiendo adjunto:', error.message)
      return null
    }

    return { path, idArchivo }
  } catch (e) {
    console.error('[adjuntosSupabaseService] Excepción subiendo adjunto:', e)
    return null
  }
}

/**
 * Genera una URL firmada temporal para descargar un adjunto.
 *
 * @param {string} path — path completo en el bucket (lo retornado por subirAdjunto)
 * @param {number} [ttlSegundos=3600] — tiempo de vida de la URL
 * @returns {Promise<string|null>} URL firmada o null si falla
 */
export const obtenerUrlFirmada = async (path, ttlSegundos = DEFAULT_URL_TTL_SEGUNDOS) => {
  if (!USE_SUPABASE || !supabase || !path) return null

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_ID)
      .createSignedUrl(path, ttlSegundos)

    if (error || !data?.signedUrl) {
      console.warn('[adjuntosSupabaseService] No se pudo generar URL firmada:', error?.message)
      return null
    }

    return data.signedUrl
  } catch (e) {
    console.error('[adjuntosSupabaseService] Excepción generando URL firmada:', e)
    return null
  }
}

/**
 * Elimina un adjunto de Supabase Storage.
 *
 * @param {string} path — path del archivo a eliminar
 * @returns {Promise<boolean>} true si se eliminó (o Supabase no está configurado)
 */
export const eliminarAdjuntoDeStorage = async (path) => {
  if (!USE_SUPABASE || !supabase || !path) return true

  try {
    const { error } = await supabase.storage
      .from(BUCKET_ID)
      .remove([path])

    if (error) {
      console.warn('[adjuntosSupabaseService] No se pudo eliminar del Storage:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('[adjuntosSupabaseService] Excepción eliminando adjunto:', e)
    return false
  }
}

/**
 * Lista todos los archivos de un paciente en el bucket.
 * Útil para la migración de adjuntos existentes y para diagnóstico.
 *
 * @param {string} clinicaId
 * @param {string} pacienteId
 * @returns {Promise<Array<{name, path, size, created_at}>>} array vacío si falla
 */
export const listarArchivosDePaciente = async (clinicaId, pacienteId) => {
  if (!USE_SUPABASE || !supabase || !clinicaId || !pacienteId) return []

  try {
    const tipos = ['foto', 'rx', 'consentimiento']
    const resultados = []

    for (const tipo of tipos) {
      const { data, error } = await supabase.storage
        .from(BUCKET_ID)
        .list(`${clinicaId}/${pacienteId}/${tipo}`, {
          limit: 500,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.warn(`[adjuntosSupabaseService] Error listando ${tipo}:`, error.message)
        continue
      }

      if (Array.isArray(data)) {
        data.forEach((archivo) => {
          resultados.push({
            ...archivo,
            tipo,
            path: `${clinicaId}/${pacienteId}/${tipo}/${archivo.name}`
          })
        })
      }
    }

    return resultados
  } catch (e) {
    console.error('[adjuntosSupabaseService] Excepción listando archivos:', e)
    return []
  }
}

/**
 * Verifica si Supabase Storage está disponible.
 * Útil para que useAdjuntos decida si mostrar indicador de sincronización.
 */
export const storageDisponible = () => USE_SUPABASE && supabase !== null
