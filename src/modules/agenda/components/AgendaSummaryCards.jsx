import React, { memo } from 'react'
import { Calendar, Clock, Armchair, CheckCircle2 } from 'lucide-react'

export const AgendaSummaryCards = memo(({ resumen, citas = [] }) => {
  const arrayCitas = Array.isArray(citas) ? citas : []

  const totalHoy = resumen?.totalHoy ?? arrayCitas.length

  const enEsperaCount = resumen?.enEsperaCount ?? arrayCitas.filter(
    c => c?.estado === 'En Espera' || c?.estado === 'EnEspera'
  ).length

  const enSillonCount = resumen?.enSillonCount ?? arrayCitas.filter(
    c => c?.estado === 'En Sillón' || c?.estado === 'EnSillon'
  ).length

  const finalizadosCount = resumen?.finalizadosCount ?? arrayCitas.filter(
    c => c?.estado === 'Atendido' || c?.estado === 'Finalizado'
  ).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
      {/* Citas Programadas Hoy */}
      <div className="relative overflow-hidden p-5 bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#0EA5E9]/50 before:to-transparent">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-graphite-400 mb-1">
          <Calendar size={13} className="text-[#0EA5E9]" />
          <span className="text-[10px] font-bold uppercase tracking-wider block">Citas Programadas Hoy</span>
        </div>
        <span className="text-2xl font-black text-graphite-900 dark:text-graphite-50 block tabular-nums tracking-tight">
          {totalHoy} <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400">Atenciones</span>
        </span>
      </div>

      {/* En Sala de Espera */}
      <div className="relative overflow-hidden p-5 bg-amber-50/70 dark:bg-amber-950/20 surgical:bg-[#F1F5F9] backdrop-blur-md border border-amber-200/80 dark:border-amber-800/40 surgical:border-[#475569] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-amber-500/50 before:to-transparent">
        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 mb-1">
          <Clock size={13} />
          <span className="text-[10px] font-bold uppercase tracking-wider block">En Sala de Espera</span>
        </div>
        <span className="text-2xl font-black text-amber-900 dark:text-amber-200 surgical:text-black block tabular-nums tracking-tight">
          {enEsperaCount} <span className="text-xs font-semibold">Pacientes</span>
        </span>
      </div>

      {/* En Sillón / Atención */}
      <div className="relative overflow-hidden p-5 bg-emerald-50/70 dark:bg-emerald-950/20 surgical:bg-[#F1F5F9] backdrop-blur-md border border-emerald-200/80 dark:border-emerald-800/40 surgical:border-[#475569] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/50 before:to-transparent">
        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 mb-1">
          <Armchair size={13} />
          <span className="text-[10px] font-bold uppercase tracking-wider block">En Sillón / Box</span>
        </div>
        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200 surgical:text-black block tabular-nums tracking-tight">
          {enSillonCount} <span className="text-xs font-semibold">Pacientes</span>
        </span>
      </div>

      {/* Finalizados Hoy */}
      <div className="relative overflow-hidden p-5 bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent">
        <div className="flex items-center gap-1.5 text-graphite-600 dark:text-graphite-400 mb-1">
          <CheckCircle2 size={13} className="text-[#B88E3A]" />
          <span className="text-[10px] font-bold uppercase tracking-wider block">Finalizados Hoy</span>
        </div>
        <span className="text-2xl font-black text-graphite-800 dark:text-graphite-100 surgical:text-black block tabular-nums tracking-tight">
          {finalizadosCount} <span className="text-xs font-semibold">Completados</span>
        </span>
      </div>
    </div>
  )
})

AgendaSummaryCards.displayName = 'AgendaSummaryCards'