import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRBAC } from '../../../hooks/useRBAC'
import { ROLES } from '../../../constants/rbacConstants'
import { listaArchivosDePaciente } from '../../../services/r2ArchivosService'
import { TIPO_A_CATEGORIA, CATEGORIA_A_TIPO, calcularPermisos } from './useArchivosClinicos.helpers'
import { useArchivosClinicosUploads } from './useArchivosClinicos.uploads'
import { useArchivosClinicosDownloads } from './useArchivosClinicos.downloads'
import { useArchivosClinicosDelete } from './useArchivosClinicos.delete'
import { useArchivosClinicosPapelera } from './useArchivosClinicos.papelera'
import { useThumbnailCache } from './useThumbnailCache'

/**
 * Hook para gestión de archivos clínicos en Cloudflare R2 (F7-22 Fase 8).
 *
 * Orquesta 3 hooks internos por responsabilidad:
 * - useArchivosClinicosUploads: subida con progreso
 * - useArchivosClinicosDownloads: descarga + visualización modal
 * - useArchivosClinicosDelete: eliminación con soft delete
 *
 * @param {string} pacienteId — UUID del paciente
 * @param {string} tipoArchivo — 'foto' | 'rx'
 */
export const useArchivosClinicos = (pacienteId, tipoArchivo = 'foto') => {
  const [archivos, setArchivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [archivoParaVer, setArchivoParaVer] = useState(null)

  const { rol } = useRBAC()
  const permisos = useMemo(() => calcularPermisos(rol, ROLES), [rol])
  const categoriaR2 = TIPO_A_CATEGORIA[tipoArchivo] || tipoArchivo

  const recargar = useCallback(async () => {
    if (!pacienteId) {
      setArchivos([])
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)

    try {
      const archivosDB = await listaArchivosDePaciente(pacienteId, categoriaR2)

      const archivosConTipo = archivosDB.map((archivo) => ({
        ...archivo,
        tipo: CATEGORIA_A_TIPO[archivo.categoria] || archivo.categoria,
        fecha: archivo.created_at,
        nombre: archivo.nombre_archivo,
        tamano: archivo.tamano_bytes,
      }))

      setArchivos(archivosConTipo)
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar los archivos.')
    } finally {
      setCargando(false)
    }
  }, [pacienteId, categoriaR2])

  useEffect(() => {
    recargar()
  }, [recargar])

  const { subirArchivos } = useArchivosClinicosUploads(
    pacienteId, categoriaR2, permisos, setSubiendo, setProgreso, setError, recargar
  )

  const { descargarArchivo, verArchivo, cerrarArchivoModal } = useArchivosClinicosDownloads(
    permisos, setError, setArchivoParaVer
  )

  const { eliminarArchivo } = useArchivosClinicosDelete(
    permisos, setError, setArchivos
  )

  const {
    archivosEliminados,
    cargandoPapelera,
    cargarPapelera,
    restaurarArchivo,
    vaciarPapelera,
  } = useArchivosClinicosPapelera(pacienteId, setError, recargar, permisos)

  const { cache: thumbnails, cargarThumbnail, limpiarCache } = useThumbnailCache()

  // F7-31 FIX: wrapper que recarga la papelera tras eliminar con éxito.
  // Esto evita tener que recargar la página para ver el archivo en papelera.
  const eliminarArchivoConPapelera = async (archivoId) => {
    const exito = await eliminarArchivo(archivoId)
    if (exito) {
      await cargarPapelera()
    }
    return exito
  }

  return {
    archivos,
    cargando,
    error,
    subiendo,
    progreso,
    permisos,
    subirArchivos,
    descargarArchivo,
    verArchivo,
    archivoParaVer,
    cerrarArchivoModal,
    eliminarArchivo: eliminarArchivoConPapelera,
    recargar,
    archivosEliminados,
    cargandoPapelera,
    cargarPapelera,
    restaurarArchivo,
    vaciarPapelera,
    thumbnails,
    cargarThumbnail,
    limpiarCache,
  }
}
