import React, { memo } from 'react'
import { useAdjuntos } from '../hooks/useAdjuntos'

/**
 * Sección de adjuntos clínicos (fotos, radiografías, consentimientos).
 * Tarea MASTER_ROADMAP: F1-02 + F6-E (Supabase Storage)
 *
 * F6-E: muestra indicador de sincronización con Supabase:
 * - 🔄 Sincronizando... (durante subida/eliminación)
 * - ✓ Sincronizado (adjunto tiene storagePath en Supabase)
 * - 📱 Local (adjunto solo en IndexedDB, sin storagePath)
 */
export const AdjuntosSection = memo(({ tabActiva, pacienteId }) => {
  const { adjuntos, cargando, error, subirArchivos, eliminarArchivo, sincronizando } = useAdjuntos(pacienteId)

  const handleSubirArchivo = (e, tipo) => {
    const files = e.target.files
    if (files && files.length > 0) {
      subirArchivos(files, tipo)
    }
    e.target.value = ''
  }

  const BannerError = () =>
    error ? (
      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
        ⚠ {error}
      </div>
    ) : null

  const BadgeSincronizacion = ({ registro }) => {
    if (registro.storagePath) {
      return <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">✓ Cloud</span>
    }
    return <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">📱 Local</span>
  }

  const SpinnerSincronizacion = () =>
    sincronizando ? (
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-500">
        <span className="animate-spin">🔄</span>
        <span>Sincronizando con la nube...</span>
      </div>
    ) : null

  if (tabActiva === 'Consentimientos') {
    const consentimientos = adjuntos.consentimiento

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Consentimientos Informados Firmados</h3>
            <p className="text-xs text-gray-500">Carga documentos firmados en formato PDF o imagen.</p>
          </div>
          <label className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
            📄 Adjuntar Consentimiento
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => handleSubirArchivo(e, 'consentimiento')}
              className="hidden"
            />
          </label>
        </div>

        <BannerError />
        <SpinnerSincronizacion />

        {cargando && <p className="text-xs text-gray-400 text-center py-8">Cargando adjuntos guardados…</p>}

        {!cargando && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {consentimientos.map(doc => (
              <div key={doc.id} className="border rounded-xl p-3 bg-gray-50 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate max-w-[150px]">{doc.nombre}</p>
                  <p className="text-[10px] text-gray-400">{new Date(doc.fecha).toLocaleDateString('es-CL')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <BadgeSincronizacion registro={doc} />
                  <button
                    onClick={() => eliminarArchivo(doc.id)}
                    title="Eliminar"
                    className="text-gray-400 hover:text-red-600 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!cargando && consentimientos.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">No hay consentimientos informados cargados todavía.</p>
        )}
      </div>
    )
  }

  const lista = tabActiva === 'Fotografías Clínicas' ? adjuntos.foto : adjuntos.rx
  const tipoSubida = tabActiva === 'Fotografías Clínicas' ? 'foto' : 'rx'

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 print:hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-sm text-gray-900">
            {tabActiva === 'Fotografías Clínicas' ? 'Fotografías Clínicas' : 'Radiografías'}
          </h3>
          <p className="text-xs text-gray-500">
            {tabActiva === 'Fotografías Clínicas' 
              ? 'Documenta el progreso del tratamiento con imágenes clínicas.'
              : 'Gestiona radiografías panorámicas, periapicales y otros estudios.'}
          </p>
        </div>
        <label className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
          📸 Subir {tabActiva === 'Fotografías Clínicas' ? 'Fotos' : 'Radiografías'}
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => handleSubirArchivo(e, tipoSubida)}
            className="hidden"
          />
        </label>
      </div>

      <BannerError />
      <SpinnerSincronizacion />

      {cargando && <p className="text-xs text-gray-400 text-center py-8">Cargando adjuntos guardados…</p>}

      {!cargando && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {lista.map(doc => (
            <div key={doc.id} className="border rounded-xl overflow-hidden bg-gray-50 hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={doc.url}
                  alt={doc.nombre}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate max-w-[120px]">{doc.nombre}</p>
                  <p className="text-[10px] text-gray-400">{new Date(doc.fecha).toLocaleDateString('es-CL')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <BadgeSincronizacion registro={doc} />
                  <button
                    onClick={() => eliminarArchivo(doc.id)}
                    title="Eliminar"
                    className="text-gray-400 hover:text-red-600 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!cargando && lista.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-8">
          No hay {tabActiva === 'Fotografías Clínicas' ? 'fotografías clínicas' : 'radiografías'} cargadas todavía.
        </p>
      )}
    </div>
  )
})

AdjuntosSection.displayName = 'AdjuntosSection'
