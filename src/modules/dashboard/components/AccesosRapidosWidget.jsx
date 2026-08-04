import React, { memo } from 'react'
import { ACCESOS_RAPIDOS } from '../constants/dashboardConstants'

export const AccesosRapidosWidget = memo(({ setActiveSection }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs text-xs space-y-3">
      <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">⚡ Accesos Rápidos de Navegación</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {ACCESOS_RAPIDOS.map(acc => (
          <button
            key={acc.id}
            onClick={() => setActiveSection(acc.seccion)}
            className={`p-3 rounded-xl border font-bold text-left transition-all hover:scale-[1.02] ${acc.color}`}
          >
            {acc.nombre}
          </button>
        ))}
      </div>
    </div>
  )
})

AccesosRapidosWidget.displayName = 'AccesosRapidosWidget'