import React, { memo } from 'react'
import { Ruler } from 'lucide-react'

export const ProporcionesCanino = memo(({ visibilidadDorada }) => {
  return (
    <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 uppercase tracking-wider">
          <span className="inline-flex items-center gap-1"><Ruler size={14} />Matriz de Proporción Dorada Avanzada (Central / Lateral / Canino)</span>
        </h3>
        <p className="text-gray-500 dark:text-graphite-400 text-[11px]">
          Análisis de simetría y visibilidad frontal teórica basada en la razón áurea (1.618 : 1.0 : 0.618).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 dark:text-graphite-400 font-bold uppercase block">Incisivo Central</span>
          <span className="text-xl font-black text-gray-900 dark:text-graphite-50">
            {visibilidadDorada?.estado === 'DATOS_INCOMPLETOS' ? 'N/D' : `${visibilidadDorada?.centralVisible} mm`}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-graphite-500 block">Proporción 1.618 (Ancho dominante)</span>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 dark:text-graphite-400 font-bold uppercase block">Incisivo Lateral Aparente</span>
          <span className="text-xl font-black text-gray-900 dark:text-graphite-50">
            {visibilidadDorada?.estado === 'DATOS_INCOMPLETOS' ? 'N/D' : `${visibilidadDorada?.lateralEstimado} mm`}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-graphite-500 block">Proporción 1.000 (Base de referencia)</span>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 dark:text-graphite-400 font-bold uppercase block">Canino Aparente</span>
          <span className="text-xl font-black text-gray-900 dark:text-graphite-50">
            {visibilidadDorada?.estado === 'DATOS_INCOMPLETOS' ? 'N/D' : `${visibilidadDorada?.caninoEstimado} mm`}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-graphite-500 block">Proporción 0.618 (Visibilidad frontal)</span>
        </div>
      </div>
    </div>
  )
})

ProporcionesCanino.displayName = 'ProporcionesCanino'