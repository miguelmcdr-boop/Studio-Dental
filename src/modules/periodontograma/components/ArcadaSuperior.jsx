import React, { memo } from 'react'
import { ARCADA_SUPERIOR } from '../constants/periodontalConstants'
import { TarjetaPieza } from './TarjetaPieza'

export const ArcadaSuperior = memo(({ 
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
        Arcada Superior (Piezas 1.8 a 2.8)
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 min-w-[700px]">
        {ARCADA_SUPERIOR.map(piezaId => (
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

ArcadaSuperior.displayName = 'ArcadaSuperior'