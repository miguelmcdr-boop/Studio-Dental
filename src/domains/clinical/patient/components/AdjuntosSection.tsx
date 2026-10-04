import React, { memo, useMemo, useEffect } from 'react'
import { useArchivosClinicos } from '../hooks/useArchivosClinicos'
import { ArchivoUploader } from './ArchivoUploader'
import { ArchivoViewer } from './ArchivoViewer'
import { ArchivoModal } from './ArchivoModal'
import { PapeleraArchivos } from './PapeleraArchivos'
import { useRBAC } from '../../../../hooks/useRBAC'
import { PERMISOS } from '../../../../constants/rbacConstants'

export interface AdjuntosSectionProps {
  tabActiva: string
  pacienteId: string
}

export const AdjuntosSection: React.FC<AdjuntosSectionProps> = memo(({ tabActiva, pacienteId }) => {
  // Mapeo de tab UI a tipo de archivo del hook.
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
    vaciarPapelera,
    cargarPapelera,
    restaurarArchivo,
    thumbnails,
    cargarThumbnail,
  } = useArchivosClinicos(pacienteId, tipoArchivo)

  const { puede } = useRBAC()
  const puedeVaciar = puede(PERMISOS.VACIAR_PAPELERA)

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
    <div className="bg-surface border border-surface rounded-2xl p-6 print:hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black">{configuracion.titulo}</h3>
          <p className="text-xs text-gray-500 dark:text-graphite-400 surgical:text-graphite-700">{configuracion.descripcion}</p>
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
        abierto={Boolean(archivoParaVer)}
        blobUrl={archivoParaVer?.blobUrl}
        mimeType={archivoParaVer?.mimeType}
        nombreArchivo={archivoParaVer?.nombreArchivo}
        onCerrar={cerrarArchivoModal}
      />

      <PapeleraArchivos
        archivosEliminados={archivosEliminados}
        cargando={cargandoPapelera}
        onRestaurar={restaurarArchivo}
        onVaciar={vaciarPapelera}
        puedeVaciar={puedeVaciar}
        permisos={permisos}
      />
    </div>
  )
})

AdjuntosSection.displayName = 'AdjuntosSection'
