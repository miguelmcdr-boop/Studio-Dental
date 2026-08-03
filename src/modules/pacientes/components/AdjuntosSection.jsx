import React, { memo, useState } from 'react'

export const AdjuntosSection = memo(({ tabActiva }) => {
  const [fotos, setFotos] = useState([])
  const [radiografias, setRadiografias] = useState([])
  const [consentimientos, setConsentimientos] = useState([])

  const handleSubirArchivo = (e, tipo) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      url: URL.createObjectURL(file),
      nombre: file.name,
      fecha: new Date().toLocaleDateString('es-CL')
    }))
    if (tipo === 'foto') setFotos(prev => [...prev, ...newFiles])
    if (tipo === 'rx') setRadiografias(prev => [...prev, ...newFiles])
    if (tipo === 'consentimiento') setConsentimientos(prev => [...prev, ...newFiles])
  }

  if (tabActiva === 'Consentimientos') {
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {consentimientos.map(doc => (
            <div key={doc.id} className="border rounded-xl p-3 bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-800 truncate max-w-[150px]">{doc.nombre}</p>
                <p className="text-[10px] text-gray-400">{doc.fecha}</p>
              </div>
              <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">Adjunto ✓</span>
            </div>
          ))}
        </div>

        {consentimientos.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">No hay consentimientos informados cargados todavía.</p>
        )}
      </div>
    )
  }

  const lista = tabActiva === 'Fotografías Clínicas' ? fotos : radiografias
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {lista.map(img => (
          <div key={img.id} className="border rounded-xl overflow-hidden bg-gray-50 p-2">
            <img src={img.url} alt={img.nombre} className="w-full h-32 object-cover rounded-lg mb-2" />
            <p className="text-[10px] font-semibold text-gray-700 truncate">{img.nombre}</p>
            <p className="text-[9px] text-gray-400">{img.fecha}</p>
          </div>
        ))}
      </div>

      {lista.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-8">No hay imágenes cargadas para este paciente.</p>
      )}
    </div>
  )
})

AdjuntosSection.displayName = 'AdjuntosSection'