import React, { memo } from 'react'
import { ARCADA_INFERIOR } from '../constants/periodontalConstants'
import { TarjetaPieza } from './TarjetaPieza'

export const ArcadaInferior = memo(({ 
  datosPeriodontales, 
  onSondajeChange, 
  onRecesionChange,
  onFlagToggle, 
  onAtributoChange,
  onAusenteToggle,
  onImplanteToggle
}) => {
  return (
    <div>
      <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 uppercase tracking-wider text-center text-xs">
        Arcada Inferior (Piezas 4.8 a 3.8)
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 min-w-[700px]">
        {ARCADA_INFERIOR.map(piezaId => (
          <TarjetaPieza
            key={piezaId}
            piezaId={piezaId}
            piezaData={datosPeriodontales[piezaId]}
            onSondajeChange={onSondajeChange}
            onRecesionChange={onRecesionChange}
            onFlagToggle={onFlagToggle}
            onAtributoChange={onAtributoChange}
            onAusenteToggle={onAusenteToggle}
            onImplanteToggle={onImplanteToggle}
          />
        ))}
      </div>
    </div>
  )
})

ArcadaInferior.displayName = 'ArcadaInferior'