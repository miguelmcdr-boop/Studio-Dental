import React, { memo } from 'react'
import { HALLAZGOS_ANATOMICOS } from '../constants/odontoAnatomicoConstants'

export const PiezaAnatomicaSVG = memo(({ numero, estadoPieza = {}, onCaraClick }) => {
  const obtenerColorCara = (cara) => {
    const hallazgoId = estadoPieza[cara]
    const hallazgo = HALLAZGOS_ANATOMICOS.find(h => h.id === hallazgoId)
    return hallazgo ? hallazgo.color : '#FFFFFF'
  }

  const esAusente = Object.values(estadoPieza).includes('ausente')

  return (
    <div className="flex flex-col items-center p-1 bg-white border border-gray-200 rounded-xl hover:border-black transition-all">
      <span className="text-[10px] font-bold text-gray-800 mb-1">{numero}</span>

      <div className="relative w-10 h-10">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xs">
          {/* Cara Superior (Vestibular / Palatino) */}
          <polygon
            points="0,0 100,0 75,25 25,25"
            fill={obtenerColorCara('superior')}
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onCaraClick(numero, 'superior')}
          />
          {/* Cara Derecha (Distal / Mesial) */}
          <polygon
            points="100,0 100,100 75,75 75,25"
            fill={obtenerColorCara('derecha')}
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onCaraClick(numero, 'derecha')}
          />
          {/* Cara Inferior (Lingual / Vestibular) */}
          <polygon
            points="100,100 0,100 25,75 75,75"
            fill={obtenerColorCara('inferior')}
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onCaraClick(numero, 'inferior')}
          />
          {/* Cara Izquierda (Mesial / Distal) */}
          <polygon
            points="0,100 0,0 25,25 25,75"
            fill={obtenerColorCara('izquierda')}
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onCaraClick(numero, 'izquierda')}
          />
          {/* Cara Centro (Oclusal / Incisal) */}
          <polygon
            points="25,25 75,25 75,75 25,75"
            fill={obtenerColorCara('centro')}
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onCaraClick(numero, 'centro')}
          />
        </svg>

        {esAusente && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg text-white font-black text-xs">
            ✕
          </div>
        )}
      </div>
    </div>
  )
})

PiezaAnatomicaSVG.displayName = 'PiezaAnatomicaSVG'