import React, { memo } from 'react'
import { formatearCLP } from '../utils/finanzasCalculations'

export const BalanceCajaCards = memo(({ balance }) => {
  const esPositivo = balance.saldoNeto >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Ingresos */}
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl shadow-xs">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-[#B88E3A] dark:text-[#E5C378] uppercase tracking-wider block">
            Total Ingresos
          </span>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-[#B88E3A] dark:text-[#E5C378] font-bold px-2 py-0.5 rounded-full border border-[#B88E3A]/20">
            DentikOS
          </span>
        </div>
        <span className="text-2xl font-black text-[#B88E3A] dark:text-[#E5C378] mt-1 block tabular-nums">
          {formatearCLP(balance.totalIngresos)}
        </span>
      </div>

      {/* Total Egresos */}
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl shadow-xs">
        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
          Total Egresos / Gastos
        </span>
        <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 block tabular-nums">
          {formatearCLP(balance.totalEgresos)}
        </span>
      </div>

      {/* Saldo Neto en Caja */}
      <div className="p-4 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 dark:text-graphite-400 uppercase tracking-wider block">
          Saldo Neto en Caja
        </span>
        <span
          className={`text-2xl font-black mt-1 block tabular-nums ${
            esPositivo ? 'text-[#B88E3A] dark:text-[#E5C378]' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatearCLP(balance.saldoNeto)}
        </span>
      </div>
    </div>
  )
})

BalanceCajaCards.displayName = 'BalanceCajaCards'