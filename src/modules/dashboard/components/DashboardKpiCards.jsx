import React, { memo } from 'react'

export const DashboardKpiCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
      {/* Citas Hoy & Ocupación */}
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl shadow-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-500 dark:text-graphite-400 uppercase tracking-wider">Citas Agendadas Hoy</span>
          <span className="text-[10px] bg-gray-100 dark:bg-graphite-700 font-bold px-2 py-0.5 rounded-full text-gray-700 dark:text-graphite-300 tabular-nums">
            {resumen.tasaOcupacionAgenda}% Ocupación
          </span>
        </div>
        <span className="text-2xl font-black text-gray-900 dark:text-graphite-50 block tabular-nums">{resumen.citasHoyCount} Atenciones</span>
        <div className="w-full bg-gray-100 dark:bg-graphite-700 rounded-full h-1.5 mt-2 overflow-hidden">
          <div className="bg-[#B88E3A] h-1.5 rounded-full" style={{ width: `${resumen.tasaOcupacionAgenda}%` }}></div>
        </div>
      </div>

      {/* Recaudación Diaria */}
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl shadow-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-[#B88E3A] dark:text-[#E5C378] uppercase tracking-wider block">Recaudado Hoy</span>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-[#B88E3A] dark:text-[#E5C378] font-bold px-2 py-0.5 rounded-full border border-[#B88E3A]/20">Diario</span>
        </div>
        <span className="text-2xl font-black text-[#B88E3A] dark:text-[#E5C378] block tabular-nums">
          ${resumen.recaudacionHoy.toLocaleString('es-CL')} CLP
        </span>
        <span className="text-[10px] text-gray-600 dark:text-graphite-300 font-medium block">
          Proyección Mensual: <strong className="tabular-nums text-gray-900 dark:text-graphite-100">${resumen.proyeccionMensual.toLocaleString('es-CL')} CLP</strong>
        </span>
      </div>

      {/* Tasa de Aceptación de Presupuestos */}
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl shadow-xs space-y-1">
        <span className="text-[10px] font-bold text-gray-500 dark:text-graphite-400 uppercase tracking-wider block">Efectividad Presupuestos</span>
        <span className="text-2xl font-black text-gray-900 dark:text-graphite-50 block tabular-nums">{resumen.tasaConversionPresupuestos}% Aceptación</span>
        <span className="text-[10px] text-gray-600 dark:text-graphite-300 font-medium block">
          Aceptado: <span className="tabular-nums">${resumen.montoTotalAceptado.toLocaleString('es-CL')} CLP</span>
        </span>
      </div>

      {/* Pacientes Registrados */}
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl shadow-xs space-y-1">
        <span className="text-[10px] font-bold text-gray-500 dark:text-graphite-400 uppercase tracking-wider block">Directorio Global</span>
        <span className="text-2xl font-black text-gray-900 dark:text-graphite-50 block tabular-nums">{resumen.totalPacientes} Pacientes</span>
        <span className="text-[10px] text-gray-600 dark:text-graphite-300 font-medium block">
          <span className="tabular-nums">{resumen.enEspera.length}</span> en sala de espera hoy
        </span>
      </div>
    </div>
  )
})

DashboardKpiCards.displayName = 'DashboardKpiCards'