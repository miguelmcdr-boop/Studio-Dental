import React, { memo } from 'react'
import { ACCESOS_RAPIDOS } from '../constants/dashboardConstants'
import { Zap } from 'lucide-react'

export const AccesosRapidosWidget = memo(({ setActiveSection }) => {
  return (
    <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-5 shadow-xs text-xs space-y-3">
      <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 uppercase tracking-wider inline-flex items-center gap-2"><Zap size={14} />Accesos Rápidos de Navegación</h3>
      
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