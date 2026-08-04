import React, { memo } from 'react'

export const EsterilizacionSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Cargas Realizadas Hoy</span>
        <span className="text-2xl font-black text-gray-900 mt-1 block">{resumen.cargasHoy} Ciclos</span>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Cargas Conformes</span>
        <span className="text-2xl font-black text-emerald-900 mt-1 block">{resumen.conformes} Aprobadas</span>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Ampollas Biológicas Incubando</span>
        <span className="text-2xl font-black text-amber-900 mt-1 block">{resumen.biologicosPendientes} En Espera</span>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Test Bowie-Dick Hoy</span>
        <span className={`text-2xl font-black mt-1 block ${resumen.testBowieDickHoy ? 'text-emerald-700' : 'text-red-600'}`}>
          {resumen.testBowieDickHoy ? '✅ Realizado' : '⚠️ Pendiente'}
        </span>
      </div>
    </div>
  )
})

EsterilizacionSummaryCards.displayName = 'EsterilizacionSummaryCards'