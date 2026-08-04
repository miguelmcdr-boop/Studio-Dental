import React, { memo } from 'react'
import { formatearCLP } from '../utils/finanzasCalculations'

export const BalanceCajaCards = memo(({ balance }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Total Ingresos</span>
        <span className="text-2xl font-black text-emerald-900 mt-1 block">{formatearCLP(balance.totalIngresos)}</span>
      </div>

      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Total Egresos / Gastos</span>
        <span className="text-2xl font-black text-red-900 mt-1 block">{formatearCLP(balance.totalEgresos)}</span>
      </div>

      <div className="p-4 bg-gray-900 text-white border border-black rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">Saldo Neto en Caja</span>
        <span className={`text-2xl font-black mt-1 block ${balance.saldoNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatearCLP(balance.saldoNeto)}
        </span>
      </div>
    </div>
  )
})

BalanceCajaCards.displayName = 'BalanceCajaCards'