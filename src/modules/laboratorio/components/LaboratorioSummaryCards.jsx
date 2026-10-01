import React, { memo } from 'react'

export const LaboratorioSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 dark:text-graphite-400 surgical:text-black uppercase tracking-wider block">Trabajos Activos</span>
        <span className="text-2xl font-black text-gray-900 dark:text-graphite-50 surgical:text-black mt-1 block tabular-nums">{resumen.enProcesoCount} En Proceso</span>
      </div>

      <div className="p-4 bg-clinical-success/10 dark:bg-emerald-400/10 surgical:bg-[#F1F5F9] border border-clinical-success/20 dark:border-emerald-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 surgical:text-black uppercase tracking-wider block">Listos para Instalar</span>
        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200 surgical:text-black mt-1 block tabular-nums">{resumen.listosInstalarCount} Recibidos</span>
      </div>

      <div className="p-4 bg-clinical-error/10 dark:bg-red-400/10 surgical:bg-[#F1F5F9] border border-clinical-error/20 dark:border-red-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-red-800 dark:text-red-300 surgical:text-black uppercase tracking-wider block">Repeticiones / Garantías</span>
        <span className="text-2xl font-black text-red-900 dark:text-red-200 surgical:text-black mt-1 block tabular-nums">{resumen.repeticionesCount} Ajustes</span>
      </div>

      <div className="p-4 bg-clinical-warning/10 dark:bg-amber-400/10 surgical:bg-[#F1F5F9] border border-clinical-warning/20 dark:border-amber-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 surgical:text-black uppercase tracking-wider block">Deuda Pendiente a Labs</span>
        <span className="text-2xl font-black text-amber-900 dark:text-amber-200 surgical:text-black mt-1 block tabular-nums">
          ${resumen.montoPendientePagoLab.toLocaleString('es-CL')} CLP
        </span>
      </div>
    </div>
  )
})

LaboratorioSummaryCards.displayName = 'LaboratorioSummaryCards'