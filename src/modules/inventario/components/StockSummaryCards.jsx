import React, { memo } from 'react'

export const StockSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 dark:text-graphite-400 surgical:text-black uppercase tracking-wider block">Total Insumos Registrados</span>
        <span className="text-2xl font-black text-gray-900 dark:text-graphite-50 surgical:text-black mt-1 block tabular-nums">{resumen.totalInsumos} Ítems</span>
      </div>

      <div className="p-4 bg-clinical-warning/10 dark:bg-amber-400/10 surgical:bg-[#F1F5F9] border border-clinical-warning/20 dark:border-amber-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 surgical:text-black uppercase tracking-wider block">Stock Crítico / Agotados</span>
        <span className="text-2xl font-black text-amber-900 dark:text-amber-200 surgical:text-black mt-1 block tabular-nums">{resumen.stockCriticoCount} Alertas</span>
      </div>

      <div className="p-4 bg-clinical-error/10 dark:bg-red-400/10 surgical:bg-[#F1F5F9] border border-clinical-error/20 dark:border-red-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-red-800 dark:text-red-300 surgical:text-black uppercase tracking-wider block">Próximos a Vencer / Vencidos</span>
        <span className="text-2xl font-black text-red-900 dark:text-red-200 surgical:text-black mt-1 block tabular-nums">{resumen.porVencerCount} Productos</span>
      </div>

      <div className="p-4 bg-clinical-info/10 dark:bg-sky-400/10 surgical:bg-[#F1F5F9] border border-clinical-info/20 dark:border-sky-400/30 surgical:border-[#475569] rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-blue-800 dark:text-sky-300 surgical:text-black uppercase tracking-wider block">Valor Estimado en Stock</span>
        <span className="text-2xl font-black text-blue-900 dark:text-sky-200 surgical:text-black mt-1 block tabular-nums">
          ${resumen.valorTotalInventario.toLocaleString('es-CL')} CLP
        </span>
      </div>
    </div>
  )
})

StockSummaryCards.displayName = 'StockSummaryCards'