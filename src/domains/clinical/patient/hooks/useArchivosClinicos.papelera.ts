import { useState, useCallback } from 'react'
import {
  listaArchivosEliminados,
  restaurarArchivo as restaurarArchivoService,
  vaciarPapeleraArchivos,
  type VaciarPapeleraArchivosResult
} from '../../../../services/r2ArchivosService'
import type { PermisosArchivos } from './useArchivosClinicos.helpers'

export interface ArchivoEliminadoFormateado {
  id: string
  paciente_id: string
  tipo: string
  fecha?: string | null
  nombre: string
  tamano?: number | null
  enPapelera: boolean
  categoria: string
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  eliminado_por?: string | null
  [key: string]: unknown
}

export interface UseArchivosClinicosPapeleraReturn {
  archivosEliminados: ArchivoEliminadoFormateado[]
  cargandoPapelera: boolean
  cargarPapelera: () => Promise<void>
  restaurarArchivo: (archivoId: string) => Promise<boolean>
  vaciarPapelera: () => Promise<VaciarPapeleraArchivosResult>
}

/**
 * Hook interno para gestión de papelera de archivos clínicos.
 *
 * F7-31 Fase 5: papelera de archivos clínicos.
 *
 * Proporciona:
 * - Estado: archivosEliminados, cargandoPapelera, errorPapelera
 * - Métodos: cargarPapelera, restaurarArchivo
 *
 * @param pacienteId — UUID del paciente (opcional, null para toda la clínica)
 * @param setError — setter de error del hook padre
 * @param recargarActivos — función para recargar archivos activos tras restaurar
 * @param permisos — permisos del usuario
 */
export const useArchivosClinicosPapelera = (
  pacienteId: string | null | undefined,
  setError: (error: string | null) => void,
  recargarActivos: () => Promise<void>,
  permisos: PermisosArchivos
): UseArchivosClinicosPapeleraReturn => {
  const [archivosEliminados, setArchivosEliminados] = useState<ArchivoEliminadoFormateado[]>([])
  const [cargandoPapelera, setCargandoPapelera] = useState<boolean>(false)

  const cargarPapelera = useCallback(async (): Promise<void> => {
    if (!pacienteId) {
      setArchivosEliminados([])
      return
    }

    setCargandoPapelera(true)
    setError(null)

    try {
      const eliminados = await listaArchivosEliminados(pacienteId)

      // Mapear para compatibilidad con ArchivoViewer
      const eliminadosFormateados: ArchivoEliminadoFormateado[] = (eliminados || []).map((archivo) => ({
        ...archivo,
        tipo: archivo.categoria,
        fecha: archivo.deleted_at,
        nombre: archivo.nombre_archivo,
        tamano: archivo.tamano_bytes,
        enPapelera: true, // flag para distinguir de archivos activos
      }))

      setArchivosEliminados(eliminadosFormateados)
    } catch (e) {
      const err = e as Error
      setError(err?.message || 'Error cargando papelera.')
      setArchivosEliminados([])
    } finally {
      setCargandoPapelera(false)
    }
  }, [pacienteId, setError])

  const restaurarArchivo = useCallback(async (archivoId: string): Promise<boolean> => {
    if (!permisos.puedeEliminar) {
      setError('No tienes permisos para restaurar archivos. Solo administradores y dentistas pueden restaurar.')
      return false
    }

    setError(null)

    try {
      const exito = await restaurarArchivoService(archivoId)

      if (exito) {
        // Actualizar estado local: quitar de eliminados
        setArchivosEliminados((prev) => prev.filter((a) => a.id !== archivoId))

        // Recargar archivos activos para que aparezca en la lista principal
        await recargarActivos()

        return true
      } else {
        setError('Error restaurando archivo. Intenta de nuevo.')
        return false
      }
    } catch (e) {
      const err = e as Error
      setError(err?.message || 'Error restaurando archivo.')
      return false
    }
  }, [permisos.puedeEliminar, setError, recargarActivos])

  const vaciarPapelera = useCallback(async (): Promise<VaciarPapeleraArchivosResult> => {
    if (!permisos.puedeEliminar) {
      setError('No tienes permisos para vaciar la papelera. Solo administradores pueden hacerlo.')
      return { purgados: [], rechazados: [] }
    }

    if (archivosEliminados.length === 0) {
      setError('La papelera está vacía.')
      return { purgados: [], rechazados: [] }
    }

    setError(null)
    setCargandoPapelera(true)

    try {
      const ids = archivosEliminados.map((a) => a.id)
      const resultado = await vaciarPapeleraArchivos(ids)

      if (resultado.purgados.length > 0) {
        // Actualizar estado local: quitar los purgados
        setArchivosEliminados((prev) => 
          prev.filter((a) => !resultado.purgados.includes(a.id))
        )
      }

      return resultado
    } catch (e) {
      const err = e as Error
      setError(err?.message || 'Error vaciando papelera.')
      return { purgados: [], rechazados: [], error: err.message }
    } finally {
      setCargandoPapelera(false)
    }
  }, [archivosEliminados, permisos.puedeEliminar, setError])

  return {
    archivosEliminados,
    cargandoPapelera,
    cargarPapelera,
    restaurarArchivo,
    vaciarPapelera,
  }
}
