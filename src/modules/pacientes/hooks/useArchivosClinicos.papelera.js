import { useState, useCallback } from 'react'
import { listaArchivosEliminados, restaurarArchivo as restaurarArchivoService } from '../../../services/r2ArchivosService'

/**
 * Hook interno para gestión de papelera de archivos clínicos.
 *
 * F7-31 Fase 5: papelera de archivos clínicos.
 *
 * Proporciona:
 * - Estado: archivosEliminados, cargandoPapelera, errorPapelera
 * - Métodos: cargarPapelera, restaurarArchivo
 *
 * @param {string} pacienteId — UUID del paciente (opcional, null para toda la clínica)
 * @param {Function} setError — setter de error del hook padre
 * @param {Function} recargarActivos — función para recargar archivos activos tras restaurar
 * @param {Object} permisos — permisos del usuario
 */
export const useArchivosClinicosPapelera = (pacienteId, setError, recargarActivos, permisos) => {
  const [archivosEliminados, setArchivosEliminados] = useState([])
  const [cargandoPapelera, setCargandoPapelera] = useState(false)

  const cargarPapelera = useCallback(async () => {
    if (!pacienteId) {
      setArchivosEliminados([])
      return
    }

    setCargandoPapelera(true)
    setError(null)

    try {
      const eliminados = await listaArchivosEliminados(pacienteId)

      // Mapear para compatibilidad con ArchivoViewer
      const eliminadosFormateados = eliminados.map((archivo) => ({
        ...archivo,
        tipo: archivo.categoria,
        fecha: archivo.deleted_at,
        nombre: archivo.nombre_archivo,
        tamano: archivo.tamano_bytes,
        enPapelera: true, // flag para distinguir de archivos activos
      }))

      setArchivosEliminados(eliminadosFormateados)
    } catch (e) {
      setError(e?.message || 'Error cargando papelera.')
      setArchivosEliminados([])
    } finally {
      setCargandoPapelera(false)
    }
  }, [pacienteId, setError])

  const restaurarArchivo = useCallback(async (archivoId) => {
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
      setError(e?.message || 'Error restaurando archivo.')
      return false
    }
  }, [permisos.puedeEliminar, setError, recargarActivos])

  return {
    archivosEliminados,
    cargandoPapelera,
    cargarPapelera,
    restaurarArchivo,
  }
}
