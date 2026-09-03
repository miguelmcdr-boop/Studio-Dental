import { useState, useCallback } from 'react'
import { solicitaUrlDownload } from '../../../services/r2ArchivosService'

/**
 * Hook de cache de thumbnails para archivos clínicos.
 *
 * F7-22 Fase 9: muestra vista previa inline de imágenes en el grid
 * sin saturar audit_log con FILE_DOWNLOAD repetidos.
 *
 * Estrategia:
 * - Cachea el blob URL por archivo_id (objeto en memoria)
 * - Cada archivo solo se descarga UNA vez por sesión
 * - Las siguientes vistas usan el cache sin re-descargar
 * - Solo la primera visualización registra FILE_DOWNLOAD
 *
 * @returns {{cache, cargarThumbnail, limpiarCache}}
 */
export const useThumbnailCache = () => {
  const [cache, setCache] = useState({}) // { archivoId: blobUrl }

  const cargarThumbnail = useCallback(async (archivo) => {
    // Ya está cacheado: no re-descargar
    if (cache[archivo.id]) return cache[archivo.id]

    try {
      const downloadData = await solicitaUrlDownload(archivo.id)

      if (!downloadData || !downloadData.download_url) {
        console.warn('[useThumbnailCache] Sin URL para thumbnail de', archivo.id)
        return null
      }

      const response = await fetch(downloadData.download_url, {
        headers: downloadData.download_headers,
      })

      if (!response.ok) {
        console.warn('[useThumbnailCache] Error descargando thumbnail de', archivo.id, 'status', response.status)
        return null
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      setCache((prev) => ({ ...prev, [archivo.id]: blobUrl }))

      return blobUrl
    } catch (e) {
      console.warn('[useThumbnailCache] Excepción cargando thumbnail de', archivo.id, e)
      return null
    }
  }, [cache])

  const limpiarCache = useCallback(() => {
    Object.values(cache).forEach((url) => {
      window.URL.revokeObjectURL(url)
    })
    setCache({})
  }, [cache])

  return { cache, cargarThumbnail, limpiarCache }
}
