import React, { memo, useMemo, useEffect } from 'react'
import { useArchivosClinicos } from '../hooks/useArchivosClinicos'
import { ArchivoUploader } from './ArchivoUploader'
import { ArchivoViewer } from './ArchivoViewer'
import { ArchivoModal } from './ArchivoModal'
import { PapeleraArchivos } from './PapeleraArchivos'

/**
 * Sección de adjuntos clínicos (fotos, radiografías, consentimientos).
 *
 * F7-22 Fase 8: migrado de Supabase Storage a Cloudflare R2.
 * - Capa UI: este componente orquesta ArchivoUploader + ArchivoViewer
 * - Capa lógica: useArchivosClinicos (RBAC, validaciones, estado)
 * - Capa datos: r2ArchivosService (Edge Functions + R2 + archivos_clinicos)
 *
 * Se mantiene la misma interfaz pública (tabActiva, pacienteId) para que
 * FichaPacienteModulo.jsx no necesite cambios.
 *
 * Props:
 * - tabActiva: 'Fotografías Clínicas' | 'Radiografías' | 'Consentimientos'
 * - pacienteId: UUID del paciente
 */
export const AdjuntosSection = memo(({ tabActiva, pacienteId }) => {
  // Mapeo de tab UI a tipo de archivo del hook.
  // Nota: la tab 'Consentimientos' usa ConsentimientosSection (firma digital),
  // no AdjuntosSection. Por eso solo mapeamos 2 tabs.
  const tipoArchivo = useMemo(() => {
    if (tabActiva === 'Fotografías Clínicas') return 'foto'
    if (tabActiva === 'Radiografías') return 'rx'
    return 'foto'
  }, [tabActiva])

  const {
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
    archivosEliminados,
    cargandoPapelera,
    cargarPapelera,
    restaurarArchivo,
    thumbnails,
    cargarThumbnail,
  } = useArchivosClinicos(pacienteId, tipoArchivo)

  // Cargar papelera al montar el componente
  useEffect(() => {
    cargarPapelera()
  }, [cargarPapelera])

  // Configuración de títulos/descripciones por tab
  const configuracion = useMemo(() => {
    switch (tabActiva) {
      case 'Fotografías Clínicas':
        return {
          titulo: 'Fotografías Clínicas',
          descripcion: 'Documenta el progreso del tratamiento con imágenes clínicas.',
        }
      case 'Radiografías':
        return {
          titulo: 'Radiografías',
          descripcion: 'Gestiona radiografías panorámicas, periapicales y otros estudios.',
        }
      default:
        return { titulo: 'Adjuntos', descripcion: '' }
    }
  }, [tabActiva])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 print:hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-sm text-gray-900">{configuracion.titulo}</h3>
          <p className="text-xs text-gray-500">{configuracion.descripcion}</p>
        </div>

        <ArchivoUploader
          tipoArchivo={tipoArchivo}
          permisos={permisos}
          subiendo={subiendo}
          progreso={progreso}
          onSubirArchivos={subirArchivos}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
          ⚠ {error}
        </div>
      )}

      <ArchivoViewer
        archivos={archivos}
        cargando={cargando}
        tipoArchivo={tipoArchivo}
        permisos={permisos}
        archivoParaVer={archivoParaVer}
        thumbnails={thumbnails}
        cargarThumbnail={cargarThumbnail}
        onVer={verArchivo}
        onCerrarModal={cerrarArchivoModal}
        onDescargar={descargarArchivo}
        onEliminar={eliminarArchivo}
      />

      <ArchivoModal
        abierto={!!archivoParaVer}
        blobUrl={archivoParaVer?.blobUrl}
        mimeType={archivoParaVer?.mimeType}
        nombreArchivo={archivoParaVer?.nombreArchivo}
        onCerrar={cerrarArchivoModal}
      />

      <PapeleraArchivos
        archivosEliminados={archivosEliminados}
        cargando={cargandoPapelera}
        onRestaurar={restaurarArchivo}
        permisos={permisos}
      />
    </div>
  )
})

AdjuntosSection.displayName = 'AdjuntosSection'
