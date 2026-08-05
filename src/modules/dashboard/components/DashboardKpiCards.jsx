import React, { memo } from 'react'

export const DashboardKpiCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
      {/* Citas Hoy & Ocupación */}
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Citas Agendadas Hoy</span>
          <span className="text-[10px] bg-gray-100 font-bold px-2 py-0.5 rounded-full text-gray-700">
            {resumen.tasaOcupacionAgenda}% Ocupación
          </span>
        </div>
        <span className="text-2xl font-black text-gray-900 block">{resumen.citasHoyCount} Atenciones</span>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div className="bg-black h-1.5 rounded-full" style={{ width: `${resumen.tasaOcupacionAgenda}%` }}></div>
        </div>
      </div>

      {/* Recaudación Diaria */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs space-y-1">
        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Recaudado Hoy</span>
        <span className="text-2xl font-black text-emerald-900 block">
          ${resumen.recaudacionHoy.toLocaleString('es-CL')} CLP
        </span>
        <span className="text-[10px] text-emerald-700 font-medium block">
          Proyección Mensual: <strong>${resumen.proyeccionMensual.toLocaleString('es-CL')} CLP</strong>
        </span>
      </div>

      {/* Tasa de Aceptación de Presupuestos */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl shadow-xs space-y-1">
        <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Efectividad Presupuestos</span>
        <span className="text-2xl font-black text-purple-900 block">{resumen.tasaConversionPresupuestos}% Aceptación</span>
        <span className="text-[10px] text-purple-700 font-medium block">
          Aceptado: ${resumen.montoTotalAceptado.toLocaleString('es-CL')} CLP
        </span>
      </div>

      {/* Pacientes Registrados */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs space-y-1">
        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Directorio Global</span>
        <span className="text-2xl font-black text-blue-900 block">{resumen.totalPacientes} Pacientes</span>
        <span className="text-[10px] text-blue-700 font-medium block">
          {resumen.enEspera.length} en sala de espera hoy
        </span>
      </div>
    </div>
  )
})

DashboardKpiCards.displayName = 'DashboardKpiCards'