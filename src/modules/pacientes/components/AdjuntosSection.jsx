import React, { memo } from 'react'
import { useAdjuntos } from '../hooks/useAdjuntos'

export const AdjuntosSection = memo(({ tabActiva, pacienteId }) => {
  const { adjuntos, cargando, error, subirArchivos, eliminarArchivo } = useAdjuntos(pacienteId)

  const handleSubirArchivo = (e, tipo) => {
    const files = e.target.files
    if (files && files.length > 0) {
      subirArchivos(files, tipo)
    }
    e.target.value = '' // permite volver a seleccionar el mismo archivo si se elimina y se vuelve a subir
  }

  const BannerError = () =>
    error ? (
      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
        ⚠ {error}
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
                  <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">Adjunto ✓</span>
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 print:hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-sm text-gray-900">{tabActiva}</h3>
        <label className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
          📷 Cargar Archivos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleSubirArchivo(e, tipoSubida)}
            className="hidden"
          />
        </label>
      </div>

      <BannerError />

      {cargando && <p className="text-xs text-gray-400 text-center py-8">Cargando adjuntos guardados…</p>}

      {!cargando && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lista.map(img => (
            <div key={img.id} className="border rounded-xl overflow-hidden bg-gray-50 p-2 relative group">
              <button
                onClick={() => eliminarArchivo(img.id)}
                title="Eliminar"
                className="absolute top-1 right-1 bg-white/90 rounded-full w-5 h-5 text-[10px] font-bold text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              <img src={img.url} alt={img.nombre} className="w-full h-32 object-cover rounded-lg mb-2" />
              <p className="text-[10px] font-semibold text-gray-700 truncate">{img.nombre}</p>
              <p className="text-[9px] text-gray-400">{new Date(img.fecha).toLocaleDateString('es-CL')}</p>
            </div>
          ))}
        </div>
      )}

      {!cargando && lista.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-8">No hay imágenes cargadas para este paciente.</p>
      )}
    </div>
  )
})

AdjuntosSection.displayName = 'AdjuntosSection'