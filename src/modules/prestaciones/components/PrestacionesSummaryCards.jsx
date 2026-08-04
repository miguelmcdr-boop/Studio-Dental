import React, { memo } from 'react'

export const PrestacionesSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Procedimientos</span>
        <span className="text-2xl font-black text-gray-900 mt-1 block">{resumen.totalProcedimientos} Ítems</span>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Valor Promedio Particular</span>
        <span className="text-2xl font-black text-blue-900 mt-1 block">
          ${resumen.precioPromedio.toLocaleString('es-CL')} CLP
        </span>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Especialidad Predominante</span>
        <span className="text-lg font-black text-purple-900 mt-1 block truncate" title={resumen.especialidadMasFrecuente}>
          {resumen.especialidadMasFrecuente}
        </span>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Arancel Máximo</span>
        <span className="text-2xl font-black text-emerald-900 mt-1 block">
          ${resumen.precioMaximo.toLocaleString('es-CL')} CLP
        </span>
      </div>
    </div>
  )
})

PrestacionesSummaryCards.displayName = 'PrestacionesSummaryCards'