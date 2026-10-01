import React, { memo } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

export const EsterilizacionSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 dark:text-graphite-400 surgical:text-black uppercase tracking-wider block">Cargas Realizadas Hoy</span>
        <span className="text-2xl font-black text-gray-900 dark:text-graphite-50 surgical:text-black mt-1 block tabular-nums">{resumen.cargasHoy} Ciclos</span>
      </div>

      <div className="p-4 bg-clinical-success/10 dark:bg-emerald-400/10 surgical:bg-[#F1F5F9] border border-clinical-success/20 dark:border-emerald-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 surgical:text-black uppercase tracking-wider block">Cargas Conformes</span>
        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200 surgical:text-black mt-1 block tabular-nums">{resumen.conformes} Aprobadas</span>
      </div>

      <div className="p-4 bg-clinical-warning/10 dark:bg-amber-400/10 surgical:bg-[#F1F5F9] border border-clinical-warning/20 dark:border-amber-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 surgical:text-black uppercase tracking-wider block">Ampollas Biológicas Incubando</span>
        <span className="text-2xl font-black text-amber-900 dark:text-amber-200 surgical:text-black mt-1 block tabular-nums">{resumen.biologicosPendientes} En Espera</span>
      </div>

      <div className="p-4 bg-clinical-info/10 dark:bg-sky-400/10 surgical:bg-[#F1F5F9] border border-clinical-info/20 dark:border-sky-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-blue-800 dark:text-sky-300 surgical:text-black uppercase tracking-wider block">Test Bowie-Dick Hoy</span>
        <span className={`text-2xl font-black mt-1 block tabular-nums ${resumen.testBowieDickHoy ? 'text-emerald-700 dark:text-emerald-300 surgical:text-black' : 'text-red-600 dark:text-red-400 surgical:text-black'}`}>
          {resumen.testBowieDickHoy ? <span className='inline-flex items-center gap-1'><CheckCircle2 size={12} className='text-green-600 dark:text-emerald-300' />Realizado</span> : <span className='inline-flex items-center gap-1'><AlertTriangle size={12} className='text-amber-600 dark:text-amber-300' />Pendiente</span>}
        </span>
      </div>
    </div>
  )
})

EsterilizacionSummaryCards.displayName = 'EsterilizacionSummaryCards'