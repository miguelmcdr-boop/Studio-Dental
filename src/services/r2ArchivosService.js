/**
 * Servicio de archivos clínicos en Cloudflare R2 (F7-22 Fase 8).
 *
 * Tarea MASTER_ROADMAP: F7-22 — Cloudflare R2 External Clinical Storage.
 *
 * Arquitectura:
 * - Edge Functions generan URLs firmadas (AWS v4)
 * - Frontend sube/descarga directamente a R2 con URLs firmadas
 * - Metadata en Supabase (tabla archivos_clinicos)
 * - Auditoría completa en audit_log (FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE)
 *
 * Categorías soportadas:
 * - radiografia: panorámica, periapical, bitewing, CBCT
 * - foto_clinica: extraoral, intraoral, perfil, sonrisa
 * - pdf: consentimientos, recetas escaneadas, documentos
 * - documento: otros formatos (docx, xlsx, etc.)
 * - otro: categoría genérica
 *
 * Seguridad:
 * - JWT de Supabase obligatorio en cada request
 * - Validación de clínica + RBAC en Edge Functions
 * - URLs firmadas con expiración corta (5-15 min)
 * - Tokens R2 nunca expuestos al cliente
 */

import { supabase } from './supabaseClient'
import { createLogger } from './logger'

const log = createLogger('r2ArchivosService')

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Solicita URL firmada para subir archivo a R2.
 *
 * @param {Object} params
 * @param {string} params.pacienteId — UUID del paciente
 * @param {string} params.categoria — 'radiografia' | 'foto_clinica' | 'pdf' | 'documento' | 'otro'
 * @param {string} params.nombreArchivo — nombre original del archivo
 * @param {string} params.mimeType — tipo MIME (ej: 'image/jpeg', 'application/pdf')
 * @param {number} params.tamanoBytes — tamaño en bytes
 * @returns {Promise<{archivo_id, r2_object_key, upload_url, upload_headers, expires_in} | null>}
 */
export const solicitaUrlUpload = async ({ pacienteId, categoria, nombreArchivo, mimeType, tamanoBytes }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log.error('No hay sesión activa')
      return null
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-upload-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paciente_id: pacienteId,
        categoria,
        nombre_archivo: nombreArchivo,
        mime_type: mimeType,
        tamano_bytes: tamanoBytes,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      log.error(`Error solicitando URL de upload: ${response.status}`, errorBody)
      return null
    }

    return await response.json()
  } catch (error) {
    log.error('Excepción solicitando URL de upload:', error)
    return null
  }
}

/**
 * Sube archivo directamente a R2 usando URL firmada.
 *
 * @param {Object} params
 * @param {string} params.uploadUrl — URL firmada de R2
 * @param {Record<string, string>} params.uploadHeaders — headers requeridos por R2
 * @param {File|Blob} params.file — archivo a subir
 * @param {Function} [params.onProgress] — callback de progreso (0-100)
 * @returns {Promise<boolean>} true si se subió correctamente
 */
export const subeArchivoAR2 = async ({ uploadUrl, uploadHeaders, file, onProgress }) => {
  try {
    // Usar XMLHttpRequest para obtener progreso
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          onProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true)
        } else {
          log.error(`Error subiendo a R2: ${xhr.status}`, xhr.responseText)
          resolve(false)
        }
      })

      xhr.addEventListener('error', () => {
        log.error('Error de red subiendo a R2')
        resolve(false)
      })

      xhr.open('PUT', uploadUrl)

      // Agregar headers requeridos
      Object.entries(uploadHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      xhr.send(file)
    })
  } catch (error) {
    log.error('Excepción subiendo archivo a R2:', error)
    return false
  }
}

/**
 * Solicita URL firmada para descargar archivo desde R2.
 *
 * @param {string} archivoId — UUID del archivo en archivos_clinicos
 * @returns {Promise<{archivo_id, download_url, download_headers, expires_in} | null>}
 */
export const solicitaUrlDownload = async (archivoId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log.error('No hay sesión activa')
      return null
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-download-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        archivo_id: archivoId,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      log.error(`Error solicitando URL de download: ${response.status}`, errorBody)
      return null
    }

    return await response.json()
  } catch (error) {
    log.error('Excepción solicitando URL de download:', error)
    return null
  }
}

/**
 * Descarga archivo desde R2 usando URL firmada.
 *
 * @param {Object} params
 * @param {string} params.downloadUrl — URL firmada de R2
 * @param {Record<string, string>} params.downloadHeaders — headers requeridos por R2
 * @param {string} params.nombreArchivo — nombre para guardar el archivo
 * @returns {Promise<boolean>} true si se descargó correctamente
 */
export const descargaArchivoDeR2 = async ({ downloadUrl, downloadHeaders, nombreArchivo }) => {
  try {
    const response = await fetch(downloadUrl, {
      headers: downloadHeaders,
    })

    if (!response.ok) {
      log.error(`Error descargando de R2: ${response.status}`)
      return false
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return true
  } catch (error) {
    log.error('Excepción descargando archivo de R2:', error)
    return false
  }
}


/**
 * Abre archivo desde R2 en nueva pestaña usando URL firmada con headers.
 *
 * Importante: las URLs generadas por las Edge Functions usan firma AWS v4
 * en headers, no query params. Por eso NO se puede hacer window.open(downloadUrl)
 * directamente; primero se hace fetch con headers, luego se crea un blob URL.
 *
 * @param {Object} params
 * @param {string} params.downloadUrl — URL firmada de R2
 * @param {Record<string, string>} params.downloadHeaders — headers requeridos por R2
 * @param {string} params.mimeType — tipo MIME del archivo
 * @returns {Promise<boolean>} true si se abrió correctamente
 */
export const abrirArchivoDeR2 = async ({ downloadUrl, downloadHeaders, mimeType }) => {
  try {
    const response = await fetch(downloadUrl, {
      headers: downloadHeaders,
    })

    if (!response.ok) {
      log.error(`Error abriendo archivo de R2: ${response.status}`)
      return false
    }

    const blob = await response.blob()
    const blobConTipo = new Blob([blob], { type: mimeType || blob.type || 'application/octet-stream' })
    const url = window.URL.createObjectURL(blobConTipo)

    const ventana = window.open(url, '_blank', 'noopener,noreferrer')
    if (!ventana) {
      log.warn('El navegador bloqueó la apertura de nueva pestaña')
      window.URL.revokeObjectURL(url)
      return false
    }

    // Revocar después de un tiempo prudente para permitir que el navegador cargue el blob
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 60_000)

    return true
  } catch (error) {
    log.error('Excepción abriendo archivo de R2:', error)
    return false
  }
}

/**
 * Elimina archivo de R2 + soft delete en metadata.
 *
 * @param {string} archivoId — UUID del archivo en archivos_clinicos
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const eliminaArchivo = async (archivoId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log.error('No hay sesión activa')
      return null
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        archivo_id: archivoId,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      log.error(`Error eliminando archivo: ${response.status}`, errorBody)
      return false
    }

    const result = await response.json()
    return result.success === true
  } catch (error) {
    log.error('Excepción eliminando archivo:', error)
    return false
  }
}

/**
 * Lista archivos clínicos de un paciente desde Supabase.
 *
 * @param {string} pacienteId — UUID del paciente
 * @param {string} [categoria] — filtrar por categoría (opcional)
 * @returns {Promise<Array>} array de archivos (vacío si falla)
 */
export const listaArchivosDePaciente = async (pacienteId, categoria = null) => {
  try {
    let query = supabase
      .from('archivos_clinicos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    const { data, error } = await query

    if (error) {
      log.error('Error listando archivos:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    log.error('Excepción listando archivos:', error)
    return []
  }
}


// ============================================================
// F7-31: MÉTODOS PARA PAPELERA DE ARCHIVOS
// ============================================================

/**
 * Lista archivos eliminados (papelera) de un paciente o de toda la clínica.
 *
 * F7-31 Fase 4: papelera de archivos clínicos.
 *
 * @param {string} pacienteId — UUID del paciente (opcional, null para toda la clínica)
 * @returns {Promise<Array>} Array de archivos eliminados
 */
export const listaArchivosEliminados = async (pacienteId = null) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log.error('No hay sesión activa para listar papelera')
      return []
    }

    const body = pacienteId ? { paciente_id: pacienteId } : {}

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-list-deleted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      log.error('Error listando papelera:', errorData)
      return []
    }

    const data = await response.json()
    return data.archivos || []
  } catch (e) {
    log.error('Excepción listando papelera:', e)
    return []
  }
}

/**
 * Restaura archivo eliminado (papelera → activo).
 *
 * F7-31 Fase 4: papelera de archivos clínicos.
 *
 * @param {string} archivoId — UUID del archivo a restaurar
 * @returns {Promise<boolean>} true si se restauró correctamente
 */
export const restaurarArchivo = async (archivoId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      log.error('No hay sesión activa para restaurar archivo')
      return false
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ archivo_id: archivoId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      log.error('Error restaurando archivo:', errorData)
      return false
    }

    const data = await response.json()
    log.info(`Archivo restaurado: ${archivoId}`)
    return data.success === true
  } catch (e) {
    log.error('Excepción restaurando archivo:', e)
    return false
  }
}
