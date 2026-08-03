import React, { memo } from 'react'
import { TEMPORAL_SUPERIOR, TEMPORAL_INFERIOR } from '../constants/pediatriaConstants'

export const OdontogramaTemporal = memo(({ datosDentosana = {}, onToggleEstadoPieza }) => {
  const ESTADOS_DISPONIBLES = [
    { id: 'sano', label: 'Sano', color: 'bg-emerald-500 text-white' },
    { id: 'caries', label: 'Caries', color: 'bg-red-500 text-white' },
    { id: 'obturado', label: 'Obturado', color: 'bg-blue-500 text-white' },
    { id: 'extraido', label: 'Extraído', color: 'bg-gray-800 text-white' }
  ]

  const renderFila = (piezas) => (
    <div className="flex flex-wrap gap-2 justify-center">
      {piezas.map(piezaId => {
        const estadoActual = datosDentosana[piezaId] || 'sano'
        return (
          <div key={piezaId} className="border rounded-xl p-2 bg-white text-center w-20 shadow-2xs space-y-1">
            <span className="font-bold text-xs block border-b pb-0.5 text-gray-900">P.{piezaId}</span>
            <div className="flex flex-col gap-1">
              {ESTADOS_DISPONIBLES.map(est => (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => onToggleEstadoPieza(piezaId, est.id)}
                  className={`text-[9px] font-bold py-0.5 px-1 rounded transition-all cursor-pointer ${
                    estadoActual === est.id ? est.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {est.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          🦷 Odontograma Temporal / Deciduo (Dentosana)
        </h3>
        <p className="text-gray-500 text-[11px]">Registro rápido de estado clínico para piezas primarias (5.1 a 8.5).</p>
      </div>

      <div className="space-y-4 overflow-x-auto">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2 text-center">Arcada Superior Decidua</h4>
          {renderFila(TEMPORAL_SUPERIOR)}
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2 text-center">Arcada Inferior Decidua</h4>
          {renderFila(TEMPORAL_INFERIOR)}
        </div>
      </div>
    </div>
  )
})

OdontogramaTemporal.displayName = 'OdontogramaTemporal'