import React, { memo } from 'react'

export const ComunicacionesSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-graphite-500 dark:text-graphite-400 surgical:text-black uppercase tracking-wider block">Total Comunicaciones</span>
        <span className="text-2xl font-black text-graphite-900 dark:text-graphite-50 surgical:text-black mt-1 block tabular-nums">{resumen.totalEnviados} Registros</span>
      </div>

      <div className="p-4 bg-emerald-50/70 dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-emerald-200 dark:border-emerald-800/50 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 surgical:text-black uppercase tracking-wider block">Tasa de Confirmación</span>
        <span className="text-2xl font-black text-emerald-900 dark:text-emerald-300 surgical:text-black mt-1 block tabular-nums">
          {resumen.tasaConfirmacion}% Citas Confirmadas
        </span>
      </div>

      <div className="p-4 bg-[#FFF5DF]/60 dark:bg-[#1E293B] surgical:bg-[#F1F5F9] border border-[#E5C378]/50 dark:border-[#B88E3A]/40 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-[#7A591F] dark:text-[#E5C378] surgical:text-black uppercase tracking-wider block">Enviados por WhatsApp</span>
        <span className="text-2xl font-black text-[#573E13] dark:text-white surgical:text-black mt-1 block tabular-nums">
          {resumen.totalWhatsApp} Envíos
        </span>
      </div>

      <div className="p-4 bg-indigo-50/70 dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-indigo-200 dark:border-indigo-800/50 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 surgical:text-black uppercase tracking-wider block">Correos Electrónicos</span>
        <span className="text-2xl font-black text-indigo-900 dark:text-indigo-300 surgical:text-black mt-1 block tabular-nums">
          {resumen.totalEmail} Mails
        </span>
      </div>
    </div>
  )
})

ComunicacionesSummaryCards.displayName = 'ComunicacionesSummaryCards'