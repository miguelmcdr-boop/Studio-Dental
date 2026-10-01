import React, { memo } from 'react'

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
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 dark:text-graphite-400 uppercase tracking-wider block">Citas Programadas Hoy</span>
        <span className="text-2xl font-black text-gray-900 dark:text-graphite-50 mt-1 block">{totalHoy} Atenciones</span>
      </div>

      <div className="p-4 bg-amber-500/10 dark:bg-amber-400/10 surgical:bg-[#F1F5F9] border border-amber-500/20 dark:border-amber-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 surgical:text-black uppercase tracking-wider block">En Sala de Espera</span>
        <span className="text-2xl font-black text-amber-900 dark:text-amber-200 surgical:text-black mt-1 block">
          {enEsperaCount} Pacientes
        </span>
      </div>

      <div className="p-4 bg-emerald-500/10 dark:bg-emerald-400/10 surgical:bg-[#F1F5F9] border border-emerald-500/20 dark:border-emerald-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 surgical:text-black uppercase tracking-wider block">En Sillón / Atención</span>
        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200 surgical:text-black mt-1 block">
          {enSillonCount} Pacientes
        </span>
      </div>

      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-600 dark:text-graphite-400 uppercase tracking-wider block">Finalizados Hoy</span>
        <span className="text-2xl font-black text-gray-800 dark:text-graphite-100 surgical:text-black mt-1 block">
          {finalizadosCount} Completados
        </span>
      </div>
    </div>
  )
})

AgendaSummaryCards.displayName = 'AgendaSummaryCards'