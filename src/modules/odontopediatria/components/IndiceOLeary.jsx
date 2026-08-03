import React, { memo } from 'react'
import { TEMPORAL_SUPERIOR, TEMPORAL_INFERIOR, CARAS_OLEARY } from '../constants/pediatriaConstants'

export const IndiceOLeary = memo(({ mapaOleary, porcentaje, piezasPresentes, onToggleCara, onCambiarPiezasPresentes }) => {
  const getSemaforoColor = (pct) => {
    if (pct <= 15) return 'bg-emerald-100 border-emerald-300 text-emerald-900'
    if (pct <= 30) return 'bg-yellow-100 border-yellow-300 text-yellow-900'
    return 'bg-red-100 border-red-300 text-red-900'
  }

  const renderFilaPiezas = (piezas) => (
    <div className="flex flex-wrap gap-2 justify-center">
      {piezas.map(piezaId => (
        <div key={piezaId} className="border rounded-xl p-2 bg-white text-center w-16 shadow-2xs">
          <span className="font-bold text-[11px] block border-b pb-0.5 mb-1 text-gray-800">P.{piezaId}</span>
          <div className="grid grid-cols-2 gap-1 text-[8px]">
            {CARAS_OLEARY.map(cara => {
              const activa = !!mapaOleary?.[piezaId]?.[cara]
              return (
                <button
                  key={cara}
                  type="button"
                  onClick={() => onToggleCara(piezaId, cara)}
                  className={`h-4 rounded font-bold uppercase transition-colors cursor-pointer ${
                    activa ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={`${cara.toUpperCase()} (Pieza ${piezaId})`}
                >
                  {cara.slice(0, 1).toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            📊 Control de Higiene e Índice de Placa de O'Leary
          </h3>
          <p className="text-gray-500 text-[11px]">Marca las caras teñidas con revelador de placa (Mesial, Vestibular, Distal, Palatino/Lingual).</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-600">Piezas evaluadas:</span>
            <input
              type="number"
              min="1"
              max="32"
              value={piezasPresentes || 20}
              onChange={(e) => onCambiarPiezasPresentes('piezasPresentesOleary', parseInt(e.target.value, 10) || 1)}
              className="w-14 px-2 py-1 border rounded-lg font-bold text-center text-xs"
            />
          </div>

          <div className={`px-4 py-2 rounded-xl border text-center ${getSemaforoColor(porcentaje)}`}>
            <span className="text-[10px] uppercase font-bold block">Índice O'Leary</span>
            <span className="text-2xl font-black">{porcentaje}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 overflow-x-auto">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2 text-center">Arcada Temporal Superior</h4>
          {renderFilaPiezas(TEMPORAL_SUPERIOR)}
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2 text-center">Arcada Temporal Inferior</h4>
          {renderFilaPiezas(TEMPORAL_INFERIOR)}
        </div>
      </div>
    </div>
  )
})

IndiceOLeary.displayName = 'IndiceOLeary'