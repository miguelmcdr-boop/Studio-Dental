import React, { memo } from 'react'

export const PagosSummaryCards = memo(({ resumen }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Recaudación Efectiva Hoy</span>
        <span className="text-2xl font-black text-gray-900 mt-1 block">
          ${resumen.recaudadoHoy.toLocaleString('es-CL')} CLP
        </span>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Total Recaudado Histórico</span>
        <span className="text-2xl font-black text-emerald-900 mt-1 block">
          ${resumen.totalRecaudado.toLocaleString('es-CL')} CLP
        </span>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Boletas Honorarios SII</span>
        <span className="text-2xl font-black text-blue-900 mt-1 block">
          ${resumen.totalBoletasHonorarios.toLocaleString('es-CL')} CLP
        </span>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Co-Pagos I-Med / POS</span>
        <span className="text-2xl font-black text-purple-900 mt-1 block">
          ${(resumen.totalBonoIMed + resumen.totalTarjetasPOS).toLocaleString('es-CL')} CLP
        </span>
      </div>
    </div>
  )
})

PagosSummaryCards.displayName = 'PagosSummaryCards'