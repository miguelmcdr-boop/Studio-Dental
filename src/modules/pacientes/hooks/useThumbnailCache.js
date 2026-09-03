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
    console.log('[useThumbnailCache] cargarThumbnail llamado para:', archivo.id, archivo.nombre_archivo)
    
    // Ya está cacheado
    if (cache[archivo.id]) {
      console.log('[useThumbnailCache] Usando cache para:', archivo.id)
      return cache[archivo.id]
    }

    try {
      const downloadData = await solicitaUrlDownload(archivo.id)
      console.log('[useThumbnailCache] downloadData:', downloadData)

      if (!downloadData || !downloadData.download_url) {
        console.warn('[useThumbnailCache] No se pudo obtener URL para thumbnail de', archivo.id)
        return null
      }

      console.log('[useThumbnailCache] Haciendo fetch a:', downloadData.download_url)
      const response = await fetch(downloadData.download_url, {
        headers: downloadData.download_headers,
      })

      console.log('[useThumbnailCache] Response status:', response.status)

      if (!response.ok) {
        console.warn('[useThumbnailCache] Error descargando thumbnail de', archivo.id, 'Status:', response.status)
        return null
      }

      const blob = await response.blob()
      console.log('[useThumbnailCache] Blob creado, tamaño:', blob.size, 'tipo:', blob.type)
      const blobUrl = window.URL.createObjectURL(blob)
      console.log('[useThumbnailCache] Blob URL creado:', blobUrl)

      // Cachear en state (inmutable update)
      console.log('[useThumbnailCache] Cacheando blob URL para:', archivo.id)
      setCache((prev) => ({ ...prev, [archivo.id]: blobUrl }))
      console.log('[useThumbnailCache] Cache actualizado, retornando:', blobUrl)

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
