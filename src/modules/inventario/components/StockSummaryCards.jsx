import React, { memo } from 'react'

export const StockSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Insumos Registrados</span>
        <span className="text-2xl font-black text-gray-900 mt-1 block">{resumen.totalInsumos} Ítems</span>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Stock Crítico / Agotados</span>
        <span className="text-2xl font-black text-amber-900 mt-1 block">{resumen.stockCriticoCount} Alertas</span>
      </div>

      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Próximos a Vencer / Vencidos</span>
        <span className="text-2xl font-black text-red-900 mt-1 block">{resumen.porVencerCount} Productos</span>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Valor Estimado en Stock</span>
        <span className="text-2xl font-black text-blue-900 mt-1 block">
          ${resumen.valorTotalInventario.toLocaleString('es-CL')} CLP
        </span>
      </div>
    </div>
  )
})

StockSummaryCards.displayName = 'StockSummaryCards'