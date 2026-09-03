import { useCallback } from 'react'
import { solicitaUrlDownload, descargaArchivoDeR2 } from '../../../services/r2ArchivosService'

/**
 * Hook interno para lógica de descarga y visualización de archivos.
 */
export const useArchivosClinicosDownloads = (permisos, setError, setArchivoParaVer) => {
  const descargarArchivo = useCallback(async (archivoId, nombreArchivo) => {
    if (!permisos.puedeDescargar) {
      setError('No tienes permisos para descargar archivos.')
      return
    }

    setError(null)

    try {
      const downloadData = await solicitaUrlDownload(archivoId)

      if (!downloadData || !downloadData.download_url) {
        setError('No se pudo obtener URL de descarga. Intenta de nuevo.')
        return
      }

      const exito = await descargaArchivoDeR2({
        downloadUrl: downloadData.download_url,
        downloadHeaders: downloadData.download_headers,
        nombreArchivo,
      })

      if (!exito) {
        setError('Error descargando archivo. Intenta de nuevo.')
      }
    } catch (e) {
      setError(e?.message || 'Error descargando archivo.')
    }
  }, [permisos.puedeDescargar, setError])

  const verArchivo = useCallback(async (archivoId, mimeType, nombreArchivo) => {
    if (!permisos.puedeVer) {
      setError('No tienes permisos para ver archivos.')
      return
    }

    setError(null)

    try {
      const downloadData = await solicitaUrlDownload(archivoId)

      if (!downloadData || !downloadData.download_url) {
        setError('No se pudo obtener URL para ver el archivo. Intenta de nuevo.')
        return
      }

      const response = await fetch(downloadData.download_url, {
        headers: downloadData.download_headers,
      })

      if (!response.ok) {
        setError('Error descargando archivo para visualización.')
        return
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      setArchivoParaVer({
        blobUrl,
        mimeType: mimeType || blob.type || 'application/octet-stream',
        nombreArchivo,
      })
    } catch (e) {
      setError(e?.message || 'Error cargando archivo para visualización.')
    }
  }, [permisos.puedeVer, setError, setArchivoParaVer])

  const cerrarArchivoModal = useCallback(() => {
    setArchivoParaVer((prev) => {
      if (prev?.blobUrl) {
        window.URL.revokeObjectURL(prev.blobUrl)
      }
      return null
    })
  }, [])

  return { descargarArchivo, verArchivo, cerrarArchivoModal }
}
