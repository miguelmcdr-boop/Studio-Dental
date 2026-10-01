import { useCallback } from 'react'
import { eliminaArchivo as eliminaArchivoService } from '../../../services/r2ArchivosService'

/**
 * Hook interno para lógica de eliminación de archivos.
 */
export const useArchivosClinicosDelete = (permisos, setError, setArchivos) => {
  const eliminarArchivo = useCallback(async (archivoId) => {
    if (!permisos.puedeEliminar) {
      setError('No tienes permisos para eliminar archivos. Solo administradores y dentistas pueden eliminar.')
      return
    }

    setError(null)

    try {
      const exito = await eliminaArchivoService(archivoId)

      if (exito) {
        setArchivos((prev) => prev.filter((a) => a.id !== archivoId))
        return true
      } else {
        setError('Error eliminando archivo. Intenta de nuevo.')
        return false
      }
    } catch (e) {
      setError(e?.message || 'Error eliminando archivo.')
      return false
    }
  }, [permisos.puedeEliminar, setError, setArchivos])

  return { eliminarArchivo }
}
