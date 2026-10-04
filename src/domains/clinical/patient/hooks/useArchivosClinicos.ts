import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRBAC } from '../../../../hooks/useRBAC'
import { ROLES } from '../../../../constants/rbacConstants'
import { listaArchivosDePaciente, type VaciarPapeleraArchivosResult } from '../../../../infrastructure/storage/r2ArchivosService'
import {
  TIPO_A_CATEGORIA,
  CATEGORIA_A_TIPO,
  calcularPermisos,
  type PermisosArchivos,
  type RolesMapRef
} from './useArchivosClinicos.helpers'
import { useArchivosClinicosUploads } from './useArchivosClinicos.uploads'
import { useArchivosClinicosDownloads, type ArchivoVisualizar } from './useArchivosClinicos.downloads'
import { useArchivosClinicosDelete } from './useArchivosClinicos.delete'
import { useArchivosClinicosPapelera, type ArchivoEliminadoFormateado } from './useArchivosClinicos.papelera'
import { useThumbnailCache, type ArchivoConId } from './useThumbnailCache'

export type { ArchivoVisualizar, ArchivoEliminadoFormateado, PermisosArchivos }

export interface ArchivoClinicoUI {
  id: string
  paciente_id: string
  tipo: string
  fecha?: string | null
  nombre: string
  tamano?: number | null
  categoria: string
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  [key: string]: unknown
}

export interface UseArchivosClinicosReturn {
  archivos: ArchivoClinicoUI[]
  cargando: boolean
  error: string | null
  subiendo: boolean
  progreso: number
  permisos: PermisosArchivos
  subirArchivos: (files: FileList | File[]) => Promise<void>
  descargarArchivo: (archivoId: string, nombreArchivo: string) => Promise<void>
  verArchivo: (archivoId: string, mimeType?: string | null, nombreArchivo?: string) => Promise<void>
  archivoParaVer: ArchivoVisualizar | null
  cerrarArchivoModal: () => void
  eliminarArchivo: (archivoId: string) => Promise<boolean>
  recargar: () => Promise<void>
  archivosEliminados: ArchivoEliminadoFormateado[]
  cargandoPapelera: boolean
  cargarPapelera: () => Promise<void>
  restaurarArchivo: (archivoId: string) => Promise<boolean>
  vaciarPapelera: () => Promise<VaciarPapeleraArchivosResult>
  thumbnails: Record<string, string>
  cargarThumbnail: (archivo: ArchivoConId) => Promise<string | null>
  limpiarCache: () => void
}

/**
 * Hook para gestión de archivos clínicos en Cloudflare R2 (F7-22 Fase 8).
 *
 * Orquesta 3 hooks internos por responsabilidad:
 * - useArchivosClinicosUploads: subida con progreso
 * - useArchivosClinicosDownloads: descarga + visualización modal
 * - useArchivosClinicosDelete: eliminación con soft delete
 *
 * @param pacienteId — UUID del paciente
 * @param tipoArchivo — 'foto' | 'rx' | 'documento' | 'otro'
 */
export const useArchivosClinicos = (
  pacienteId: string,
  tipoArchivo: string = 'foto'
): UseArchivosClinicosReturn => {
  const [archivos, setArchivos] = useState<ArchivoClinicoUI[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState<boolean>(false)
  const [progreso, setProgreso] = useState<number>(0)
  const [archivoParaVer, setArchivoParaVer] = useState<ArchivoVisualizar | null>(null)

  const { rol } = useRBAC()
  const permisos = useMemo(() => calcularPermisos(rol, ROLES as unknown as RolesMapRef), [rol])
  const categoriaR2 = TIPO_A_CATEGORIA[tipoArchivo] || tipoArchivo

  const recargar = useCallback(async (): Promise<void> => {
    if (!pacienteId) {
      setArchivos([])
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)

    try {
      const archivosDB = await listaArchivosDePaciente(pacienteId, categoriaR2)

      const archivosConTipo: ArchivoClinicoUI[] = (archivosDB || []).map((archivo) => ({
        ...archivo,
        tipo: CATEGORIA_A_TIPO[archivo.categoria] || archivo.categoria,
        fecha: archivo.created_at,
        nombre: archivo.nombre_archivo,
        tamano: archivo.tamano_bytes,
      }))

      setArchivos(archivosConTipo)
    } catch (e) {
      const err = e as Error
      setError(err?.message || 'No se pudieron cargar los archivos.')
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

  const { eliminarArchivo } = useArchivosClinicosDelete<ArchivoClinicoUI>(
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
  const eliminarArchivoConPapelera = async (archivoId: string): Promise<boolean> => {
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
