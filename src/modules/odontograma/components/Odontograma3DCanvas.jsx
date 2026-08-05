import React, { memo, useState } from 'react'

const COLORES_PATOLOGIA_3D = {
  sano: '#F9FAFB',
  caries: '#EF4444',      // Rojo
  restauracion: '#3B82F6', // Azul
  incrustacion: '#F97316', // Naranja
  sellante: '#10B981',    // Esmeralda
  corona: '#FBBF24',      // Amarillo
  endodoncia: '#A855F7',  // Morado
  implante: '#6B7280',    // Gris Grata
  ausente: '#111827'      // Negro / Vacío
}

export const Odontograma3DCanvas = memo(({ odontograma = {}, alSeleccionarPieza, piezaActiva }) => {
  const [rotacionVista, setRotacionVista] = useState('superior') // 'superior', 'inferior', 'frontal'

  const PERMANENTE_SUPERIOR = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8']
  const PERMANENTE_INFERIOR = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']

  return (
    <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-xl space-y-6">
      {/* Barra de Control 3D */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <span>🌐</span> Visor 3D Isométrico e Interactivo de Arcadas
          </h3>
          <p className="text-[11px] text-gray-400">Modelo espacial tridimensional con mapeo de patologías en tiempo real.</p>
        </div>

        <div className="flex gap-2 bg-gray-800 p-1 rounded-xl border border-gray-700 text-xs">
          <button
            type="button"
            onClick={() => setRotacionVista('superior')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              rotacionVista === 'superior' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Arcada Superior
          </button>
          <button
            type="button"
            onClick={() => setRotacionVista('inferior')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              rotacionVista === 'inferior' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Arcada Inferior
          </button>
          <button
            type="button"
            onClick={() => setRotacionVista('frontal')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              rotacionVista === 'frontal' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Vista Panorámica 360°
          </button>
        </div>
      </div>

      {/* Canvas 3D Isométrico */}
      <div className="bg-gradient-to-b from-gray-950 to-gray-900 border border-gray-800 rounded-2xl p-8 min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Efecto de rejilla espacial 3D */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

        <div className="relative z-10 space-y-8 w-full max-w-4xl">
          {/* Arcada Superior */}
          {(rotacionVista === 'superior' || rotacionVista === 'frontal') && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block text-center">Maxilar Superior (3D Render)</span>
              <div className="flex justify-center gap-2 flex-wrap">
                {PERMANENTE_SUPERIOR.map(num => {
                  const estado = odontograma[num]?.general || 'sano'
                  const colorHex = COLORES_PATOLOGIA_3D[estado] || COLORES_PATOLOGIA_3D.sano
                  const esActivo = piezaActiva === num

                  return (
                    <div
                      key={num}
                      onClick={() => alSeleccionarPieza && alSeleccionarPieza(num)}
                      className={`flex flex-col items-center cursor-pointer p-2 rounded-xl transition-all transform hover:scale-110 ${
                        esActivo ? 'bg-emerald-500/20 ring-2 ring-emerald-400 scale-110' : 'bg-gray-800/80 hover:bg-gray-700'
                      }`}
                      style={{ perspective: '500px' }}
                    >
                      <span className="text-[10px] font-black text-gray-300 mb-1">{num}</span>
                      {/* Cubo 3D Simulado con CSS transform */}
                      <div
                        className="w-9 h-9 rounded-lg border border-gray-600 shadow-lg flex items-center justify-center font-bold text-[10px] text-gray-900 transition-transform duration-300 transform rotate-x-12 rotate-y-12"
                        style={{ backgroundColor: colorHex }}
                        title={`Pieza ${num} - Estado: ${estado}`}
                      >
                        {estado === 'ausente' ? '✕' : estado === 'implante' ? 'IMP' : num}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Arcada Inferior */}
          {(rotacionVista === 'inferior' || rotacionVista === 'frontal') && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block text-center">Mandíbula Inferior (3D Render)</span>
              <div className="flex justify-center gap-2 flex-wrap">
                {PERMANENTE_INFERIOR.map(num => {
                  const estado = odontograma[num]?.general || 'sano'
                  const colorHex = COLORES_PATOLOGIA_3D[estado] || COLORES_PATOLOGIA_3D.sano
                  const esActivo = piezaActiva === num

                  return (
                    <div
                      key={num}
                      onClick={() => alSeleccionarPieza && alSeleccionarPieza(num)}
                      className={`flex flex-col items-center cursor-pointer p-2 rounded-xl transition-all transform hover:scale-110 ${
                        esActivo ? 'bg-emerald-500/20 ring-2 ring-emerald-400 scale-110' : 'bg-gray-800/80 hover:bg-gray-700'
                      }`}
                      style={{ perspective: '500px' }}
                    >
                      <span className="text-[10px] font-black text-gray-300 mb-1">{num}</span>
                      <div
                        className="w-9 h-9 rounded-lg border border-gray-600 shadow-lg flex items-center justify-center font-bold text-[10px] text-gray-900 transition-transform duration-300 transform rotate-x-12 rotate-y-12"
                        style={{ backgroundColor: colorHex }}
                        title={`Pieza ${num} - Estado: ${estado}`}
                      >
                        {estado === 'ausente' ? '✕' : estado === 'implante' ? 'IMP' : num}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda de Colores 3D */}
      <div className="flex justify-center items-center gap-4 flex-wrap text-[11px] pt-2 border-t border-gray-800">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Caries</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Restauración</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Corona</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span> Endodoncia</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-500 inline-block"></span> Implante</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600 inline-block"></span> Ausente</div>
      </div>
    </div>
  )
})

Odontograma3DCanvas.displayName = 'Odontograma3DCanvas'