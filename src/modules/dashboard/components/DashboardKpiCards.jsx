import React, { memo } from 'react'

export const DashboardKpiCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Citas Programadas Hoy</span>
        <span className="text-2xl font-black text-gray-900 mt-1 block">{resumen.citasHoyCount} Atenciones</span>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Recaudado del Día</span>
        <span className="text-2xl font-black text-emerald-900 mt-1 block">
          ${resumen.recaudacionHoy.toLocaleString('es-CL')} CLP
        </span>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Pacientes en Directorio</span>
        <span className="text-2xl font-black text-blue-900 mt-1 block">{resumen.totalPacientes} Registrados</span>
      </div>
    </div>
  )
})

DashboardKpiCards.displayName = 'DashboardKpiCards'