import React from 'react'

const ESTADOS_COLORES = {
  sano: 'fill-white stroke-gray-400',
  caries: 'fill-red-500 stroke-red-600',
  restauracion: 'fill-blue-500 stroke-blue-600',
  incrustacion: 'fill-orange-400 stroke-orange-600',
  sellante: 'fill-emerald-400 stroke-emerald-600',
  corona: 'fill-yellow-400 stroke-yellow-600',
  endodoncia: 'fill-purple-500 stroke-purple-600',
}

export const DienteSVG = ({ numero, estadosPieza, modoSeleccionado, alHacerClicCara, alSeleccionarPieza, piezaActiva }) => {
  const esActivo = piezaActiva === numero
  const estadoGeneral = estadosPieza?.general || 'sano'

  const obtenerColorCara = (cara) => {
    if (estadoGeneral !== 'sano') return ESTADOS_COLORES[estadoGeneral] || 'fill-gray-100 stroke-gray-300'
    const estadoCara = estadosPieza?.caras?.[cara] || 'sano'
    return ESTADOS_COLORES[estadoCara] || 'fill-white stroke-gray-400'
  }

  return (
    <div 
      onClick={() => alSeleccionarPieza && alSeleccionarPieza(numero)}
      className={`flex flex-col items-center cursor-pointer p-1 rounded-lg transition-all ${
        esActivo ? 'bg-blue-50 border border-blue-400 shadow-sm scale-105' : 'hover:bg-gray-100'
      }`}
    >
      <span className="text-[10px] font-bold text-gray-700 mb-0.5">{numero}</span>
      <div className="relative">
        {(estadoGeneral === 'ausente' || estadoGeneral === 'indicacion_exodoncia') && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-red-600 font-bold text-lg select-none">✕</div>
        )}
        {estadoGeneral === 'implante' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-gray-900 font-bold text-[8px] bg-gray-200/90 rounded px-0.5">IMP</div>
        )}

        <svg width="30" height="30" viewBox="0 0 100 100" className="drop-shadow-sm">
          <polygon points="15,15 85,15 70,30 30,30" className={`${obtenerColorCara('vestibular')} transition-colors cursor-pointer hover:opacity-80`} onClick={(e) => { e.stopPropagation(); alHacerClicCara && alHacerClicCara(numero, 'vestibular', modoSeleccionado) }} />
          <polygon points="85,15 85,85 70,70 70,30" className={`${obtenerColorCara('distal')} transition-colors cursor-pointer hover:opacity-80`} onClick={(e) => { e.stopPropagation(); alHacerClicCara && alHacerClicCara(numero, 'distal', modoSeleccionado) }} />
          <polygon points="15,85 85,85 70,70 30,70" className={`${obtenerColorCara('palatino')} transition-colors cursor-pointer hover:opacity-80`} onClick={(e) => { e.stopPropagation(); alHacerClicCara && alHacerClicCara(numero, 'palatino', modoSeleccionado) }} />
          <polygon points="15,15 15,85 30,70 30,30" className={`${obtenerColorCara('mesial')} transition-colors cursor-pointer hover:opacity-80`} onClick={(e) => { e.stopPropagation(); alHacerClicCara && alHacerClicCara(numero, 'mesial', modoSeleccionado) }} />
          <polygon points="30,30 70,30 70,70 30,70" className={`${obtenerColorCara('oclusal')} transition-colors cursor-pointer hover:opacity-80`} onClick={(e) => { e.stopPropagation(); alHacerClicCara && alHacerClicCara(numero, 'oclusal', modoSeleccionado) }} />
        </svg>
      </div>
    </div>
  )
}