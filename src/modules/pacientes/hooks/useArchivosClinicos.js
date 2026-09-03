import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRBAC } from '../../../hooks/useRBAC'
import { ROLES } from '../../../constants/rbacConstants'
import {
  solicitaUrlUpload,
  subeArchivoAR2,
  solicitaUrlDownload,
  descargaArchivoDeR2,
  abrirArchivoDeR2,
  eliminaArchivo,
  listaArchivosDePaciente,
} from '../../../services/r2ArchivosService'

/**
 * Hook para gestión de archivos clínicos en Cloudflare R2 (F7-22 Fase 8).
 *
 * Capa 2 de la arquitectura: estado + lógica de negocio + integración con R2.
 *
 * Capa 1: r2ArchivosService (requests a Edge Functions)
 * Capa 2: useArchivosClinicos (este hook)
 * Capa 3: ArchivoUploader, ArchivoViewer, AdjuntosSection (UI)
 *
 * Mapeo de tipos:
 * - tipo UI 'foto' → categoria R2 'foto_clinica'
 * - tipo UI 'rx' → categoria R2 'radiografia'
 * - tipo UI 'consentimiento' → categoria R2 'pdf'
 *
 * RBAC:
 * - Subir archivos: solo admin/dentista
 * - Eliminar archivos: solo admin/dentista
 * - Ver y descargar: todos los roles (admin/dentista/asistente/recepcion)
 *
 * @param {string} pacienteId — UUID del paciente
 * @param {string} tipoArchivo — 'foto' | 'rx' | 'consentimiento'
 */

// Mapeo bidireccional entre tipo UI y categoría R2.
// Nota: 'consentimiento' NO está aquí porque ConsentimientosSection
// usa firma digital en canvas, no archivos R2.
const TIPO_A_CATEGORIA = {
  foto: 'foto_clinica',
  rx: 'radiografia',
}

const CATEGORIA_A_TIPO = {
  foto_clinica: 'foto',
  radiografia: 'rx',
  documento: 'documento',
  otro: 'otro',
}

// Límites de validación
const MAX_TAMANO_MB = 50
const MAX_TAMANO_BYTES = MAX_TAMANO_MB * 1024 * 1024
const MIME_TYPES_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]

export const useArchivosClinicos = (pacienteId, tipoArchivo = 'foto') => {
  const [archivos, setArchivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)

  // Estado para modal de visualización inline
  const [archivoParaVer, setArchivoParaVer] = useState(null) // { blobUrl, mimeType, nombreArchivo }

  // RBAC oficial del proyecto
  const { rol } = useRBAC()

  // Calcular permisos basados en rol.
  // Nota: las Edge Functions también validan RBAC server-side.
  // Esto solo controla visibilidad/UX en frontend.
  const permisos = useMemo(() => {
    const puedeSubir = rol === ROLES.ADMIN || rol === ROLES.DENTISTA
    const puedeEliminar = rol === ROLES.ADMIN || rol === ROLES.DENTISTA
    const puedeVer = [ROLES.ADMIN, ROLES.DENTISTA, ROLES.ASISTENTE, ROLES.RECEPCION].includes(rol)
    const puedeDescargar = puedeVer

    return { puedeSubir, puedeEliminar, puedeVer, puedeDescargar, rol }
  }, [rol])

  // Categoría R2 basada en tipo de archivo UI
  const categoriaR2 = TIPO_A_CATEGORIA[tipoArchivo] || tipoArchivo

  /**
   * Carga archivos del paciente desde Supabase.
   */
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

      // Agregar tipo UI basado en categoría R2
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

  // Cargar archivos al montar o cuando cambia pacienteId/tipoArchivo
  useEffect(() => {
    recargar()
  }, [recargar])

  /**
   * Valida archivo antes de subir.
   * @returns {{ valido: boolean, mensaje: string }}
   */
  const validarArchivo = (file) => {
    if (file.size > MAX_TAMANO_BYTES) {
      return {
        valido: false,
        mensaje: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo ${MAX_TAMANO_MB}MB.`,
      }
    }

    if (!MIME_TYPES_PERMITIDOS.includes(file.type)) {
      return {
        valido: false,
        mensaje: `Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes y PDFs.`,
      }
    }

    if (!permisos.puedeSubir) {
      return {
        valido: false,
        mensaje: 'No tienes permisos para subir archivos. Solo administradores y dentistas pueden subir.',
      }
    }

    return { valido: true, mensaje: '' }
  }

  /**
   * Sube uno o más archivos a R2.
   * @param {FileList|File[]} files — archivos a subir
   */
  const subirArchivos = useCallback(async (files) => {
    if (!pacienteId || !permisos.puedeSubir) return

    const archivosArray = Array.from(files)
    if (archivosArray.length === 0) return

    setError(null)
    setSubiendo(true)
    setProgreso(0)

    try {
      for (let i = 0; i < archivosArray.length; i++) {
        const file = archivosArray[i]

        // Validar archivo
        const validacion = validarArchivo(file)
        if (!validacion.valido) {
          setError(validacion.mensaje)
          continue
        }

        // Solicitar URL firmada de upload
        const uploadData = await solicitaUrlUpload({
          pacienteId,
          categoria: categoriaR2,
          nombreArchivo: file.name,
          mimeType: file.type,
          tamanoBytes: file.size,
        })

        if (!uploadData || !uploadData.upload_url) {
          setError('No se pudo obtener URL de subida. Intenta de nuevo.')
          continue
        }

        // Subir archivo a R2 con progreso
        const progresoBase = (i / archivosArray.length) * 100
        const progresoIncremento = 100 / archivosArray.length

        const exito = await subeArchivoAR2({
          uploadUrl: uploadData.upload_url,
          uploadHeaders: uploadData.upload_headers,
          file,
          onProgress: (percent) => {
            const progresoTotal = progresoBase + (percent / 100) * progresoIncremento
            setProgreso(Math.round(progresoTotal))
          },
        })

        if (!exito) {
          setError(`Error subiendo ${file.name}. Intenta de nuevo.`)
        }
      }

      setProgreso(100)

      // Recargar lista de archivos
      await recargar()
    } catch (e) {
      setError(e?.message || 'Error subiendo archivos.')
    } finally {
      setSubiendo(false)
      // Limpiar progreso después de 1 segundo
      setTimeout(() => setProgreso(0), 1000)
    }
  }, [pacienteId, categoriaR2, permisos.puedeSubir, recargar])

  /**
   * Descarga archivo desde R2.
   * @param {string} archivoId — UUID del archivo
   * @param {string} nombreArchivo — nombre para guardar
   */
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
  }, [permisos.puedeDescargar])

  /**
   * Prepara archivo para ver inline en modal.
   * @param {string} archivoId — UUID del archivo
   * @param {string} mimeType — tipo MIME del archivo
   * @param {string} nombreArchivo — nombre del archivo
   */
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

      // Fetch del archivo para obtener blob
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
  }, [permisos.puedeVer])

  /**
   * Cierra el modal de visualización y revoca el blob URL.
   */
  const cerrarArchivoModal = useCallback(() => {
    if (archivoParaVer?.blobUrl) {
      window.URL.revokeObjectURL(archivoParaVer.blobUrl)
    }
    setArchivoParaVer(null)
  }, [archivoParaVer])

  /**
   * Elimina archivo de R2 + soft delete en metadata.
   * @param {string} archivoId — UUID del archivo
   */
  const eliminarArchivo = useCallback(async (archivoId) => {
    if (!permisos.puedeEliminar) {
      setError('No tienes permisos para eliminar archivos. Solo administradores y dentistas pueden eliminar.')
      return
    }

    setError(null)

    try {
      const exito = await eliminaArchivo(archivoId)

      if (exito) {
        // Remover archivo de la lista local
        setArchivos((prev) => prev.filter((a) => a.id !== archivoId))
      } else {
        setError('Error eliminando archivo. Intenta de nuevo.')
      }
    } catch (e) {
      setError(e?.message || 'Error eliminando archivo.')
    }
  }, [permisos.puedeEliminar])

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
    eliminarArchivo,
    recargar,
  }
}
