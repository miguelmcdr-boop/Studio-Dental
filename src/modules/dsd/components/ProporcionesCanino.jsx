import React, { memo } from 'react'

export const ProporcionesCanino = memo(({ visibilidadDorada }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          📐 Matriz de Proporción Dorada Avanzada (Central / Lateral / Canino)
        </h3>
        <p className="text-gray-500 text-[11px]">
          Análisis de simetría y visibilidad frontal teórica basada en la razón áurea (1.618 : 1.0 : 0.618).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 font-bold uppercase block">Incisivo Central</span>
          <span className="text-xl font-black text-gray-900">{visibilidadDorada?.centralVisible || 8.5} mm</span>
          <span className="text-[10px] text-gray-400 block">Proporción 1.618 (Ancho dominante)</span>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 font-bold uppercase block">Incisivo Lateral Aparente</span>
          <span className="text-xl font-black text-gray-900">{visibilidadDorada?.lateralEstimado || 5.25} mm</span>
          <span className="text-[10px] text-gray-400 block">Proporción 1.000 (Base de referencia)</span>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 font-bold uppercase block">Canino Aparente</span>
          <span className="text-xl font-black text-gray-900">{visibilidadDorada?.caninoEstimado || 3.25} mm</span>
          <span className="text-[10px] text-gray-400 block">Proporción 0.618 (Visibilidad frontal)</span>
        </div>
      </div>
    </div>
  )
})

ProporcionesCanino.displayName = 'ProporcionesCanino'