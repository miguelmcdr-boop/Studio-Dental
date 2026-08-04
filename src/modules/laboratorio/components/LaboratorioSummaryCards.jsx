import React, { memo } from 'react'

export const LaboratorioSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Trabajos Activos</span>
        <span className="text-2xl font-black text-gray-900 mt-1 block">{resumen.enProcesoCount} En Proceso</span>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Listos para Instalar</span>
        <span className="text-2xl font-black text-emerald-900 mt-1 block">{resumen.listosInstalarCount} Recibidos</span>
      </div>

      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Repeticiones / Garantías</span>
        <span className="text-2xl font-black text-red-900 mt-1 block">{resumen.repeticionesCount} Ajustes</span>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Deuda Pendiente a Labs</span>
        <span className="text-2xl font-black text-amber-900 mt-1 block">
          ${resumen.montoPendientePagoLab.toLocaleString('es-CL')} CLP
        </span>
      </div>
    </div>
  )
})

LaboratorioSummaryCards.displayName = 'LaboratorioSummaryCards'