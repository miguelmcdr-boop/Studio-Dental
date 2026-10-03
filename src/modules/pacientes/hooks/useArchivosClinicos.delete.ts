import { useCallback } from 'react'
import type React from 'react'
import { eliminaArchivo as eliminaArchivoService } from '../../../services/r2ArchivosService'
import type { PermisosArchivos } from './useArchivosClinicos.helpers'

export interface ArchivoItemRef {
  id: string
  [key: string]: unknown
}

export interface UseArchivosClinicosDeleteReturn {
  eliminarArchivo: (archivoId: string) => Promise<boolean>
}

/**
 * Hook interno para lógica de eliminación de archivos.
 */
export const useArchivosClinicosDelete = <T extends ArchivoItemRef>(
  permisos: PermisosArchivos,
  setError: (error: string | null) => void,
  setArchivos: React.Dispatch<React.SetStateAction<T[]>>
): UseArchivosClinicosDeleteReturn => {
  const eliminarArchivo = useCallback(async (archivoId: string): Promise<boolean> => {
    if (!permisos.puedeEliminar) {
      setError('No tienes permisos para eliminar archivos. Solo administradores y dentistas pueden eliminar.')
      return false
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
      const err = e as Error
      setError(err?.message || 'Error eliminando archivo.')
      return false
    }
  }, [permisos.puedeEliminar, setError, setArchivos])

  return { eliminarArchivo }
}
