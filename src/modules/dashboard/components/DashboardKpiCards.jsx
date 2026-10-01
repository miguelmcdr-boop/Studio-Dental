import React, { memo } from 'react'
import { Calendar, DollarSign, FileCheck, Users } from 'lucide-react'

export const DashboardKpiCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
      {/* Citas Hoy & Ocupación */}
      <div className="group relative overflow-hidden p-5 bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 space-y-2 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#0EA5E9]/50 before:to-transparent">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-graphite-400">
            <Calendar size={13} className="text-[#0EA5E9]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Citas Hoy</span>
          </div>
          <span className="text-[10px] bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/50 tabular-nums">
            {resumen.tasaOcupacionAgenda}% Ocupación
          </span>
        </div>
        <span className="text-2xl font-black text-graphite-900 dark:text-graphite-50 block tabular-nums tracking-tight">
          {resumen.citasHoyCount} <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400">Atenciones</span>
        </span>
        <div className="w-full bg-slate-100 dark:bg-[#1E293B] surgical:bg-[#CBD5E1] rounded-full h-1.5 mt-2 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] h-1.5 rounded-full transition-all duration-300" style={{ width: `${Math.min(resumen.tasaOcupacionAgenda, 100)}%` }}></div>
        </div>
      </div>

      {/* Recaudación Diaria */}
      <div className="group relative overflow-hidden p-5 bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 space-y-2 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A] before:to-transparent">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[#B88E3A] dark:text-[#E5C378]">
            <DollarSign size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider block">Recaudado Hoy</span>
          </div>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-[#B88E3A] dark:text-[#E5C378] font-bold px-2 py-0.5 rounded-full border border-[#B88E3A]/30">Diario</span>
        </div>
        <span className="text-2xl font-black text-[#B88E3A] dark:text-[#E5C378] block tabular-nums tracking-tight">
          ${resumen.recaudacionHoy.toLocaleString('es-CL')} <span className="text-xs font-semibold">CLP</span>
        </span>
        <span className="text-[10px] text-graphite-600 dark:text-graphite-300 font-medium block truncate">
          Proyección Mensual: <strong className="tabular-nums text-graphite-900 dark:text-graphite-100">${resumen.proyeccionMensual.toLocaleString('es-CL')} CLP</strong>
        </span>
      </div>

      {/* Tasa de Aceptación de Presupuestos */}
      <div className="group relative overflow-hidden p-5 bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 space-y-2 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/50 before:to-transparent">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-graphite-400">
            <FileCheck size={13} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider block">Efectividad Presupuestos</span>
          </div>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 tabular-nums">
            {resumen.tasaConversionPresupuestos}%
          </span>
        </div>
        <span className="text-2xl font-black text-graphite-900 dark:text-graphite-50 block tabular-nums tracking-tight">
          {resumen.tasaConversionPresupuestos}% <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400">Aceptación</span>
        </span>
        <span className="text-[10px] text-graphite-600 dark:text-graphite-300 font-medium block truncate">
          Total Aceptado: <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">${resumen.montoTotalAceptado.toLocaleString('es-CL')} CLP</span>
        </span>
      </div>

      {/* Pacientes Registrados */}
      <div className="group relative overflow-hidden p-5 bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 space-y-2 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-graphite-400">
            <Users size={13} className="text-[#B88E3A]" />
            <span className="text-[10px] font-bold uppercase tracking-wider block">Directorio Global</span>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-700 dark:text-graphite-300 font-bold px-2 py-0.5 rounded-full tabular-nums">
            {resumen.enEspera.length} en espera
          </span>
        </div>
        <span className="text-2xl font-black text-graphite-900 dark:text-graphite-50 block tabular-nums tracking-tight">
          {resumen.totalPacientes} <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400">Pacientes</span>
        </span>
        <span className="text-[10px] text-graphite-600 dark:text-graphite-300 font-medium block">
          <span className="tabular-nums font-bold text-[#B88E3A]">{resumen.enEspera.length}</span> en sala de espera hoy
        </span>
      </div>
    </div>
  )
})

DashboardKpiCards.displayName = 'DashboardKpiCards'