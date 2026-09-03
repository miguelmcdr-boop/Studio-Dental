import { useState, useCallback } from 'react'
import { solicitaUrlDownload } from '../../../services/r2ArchivosService'

/**
 * Hook de cache de thumbnails para archivos clínicos.
 *
 * F7-22 Fase 8 (mejora): muestra vista previa inline de imágenes
 * sin registrar múltiples FILE_DOWNLOAD en audit_log.
 *
 * Estrategia:
 * - Cachea el blob URL por archivo_id (Map en memoria)
 * - Cada archivo solo se descarga UNA vez por sesión
 * - Los siguientes "Ver" usan el cache sin re-descargar
 * - Revoca blob URLs al desmontar
 *
 * Riesgo de auditoría: solo la primera visualización de cada archivo
 * registra FILE_DOWNLOAD. Las vistas previas en el grid no registran
 * nada adicional.
 */
export const useThumbnailCache = () => {
  const [cache, setCache] = useState({}) // { archivoId: blobUrl }

  const cargarThumbnail = useCallback(async (archivo) => {
    // Ya está cacheado
    if (cache[archivo.id]) return cache[archivo.id]

    try {
      const downloadData = await solicitaUrlDownload(archivo.id)

      if (!downloadData || !downloadData.download_url) {
        console.warn('No se pudo obtener URL para thumbnail de', archivo.id)
        return null
      }

      const response = await fetch(downloadData.download_url, {
        headers: downloadData.download_headers,
      })

      if (!response.ok) {
        console.warn('Error descargando thumbnail de', archivo.id)
        return null
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      // Cachear en state (inmutable update)
      setCache((prev) => ({ ...prev, [archivo.id]: blobUrl }))

      return blobUrl
    } catch (e) {
      console.warn('Excepción cargando thumbnail de', archivo.id, e)
      return null
    }
  }, [cache])

  const limpiarCache = useCallback(() => {
    // Revocar todos los blob URLs
    Object.values(cache).forEach((url) => {
      window.URL.revokeObjectURL(url)
    })
    setCache({})
  }, [cache])

  return { cache, cargarThumbnail, limpiarCache }
}
