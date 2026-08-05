import React, { memo } from 'react'

export const CpodSummaryCard = memo(({ cpodStats }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs mb-6 text-xs space-y-3 print:hidden">
      <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 uppercase tracking-wider">📊 Índice Epidemiológico OMS (CPO-D)</span>
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${cpodStats.colorBadge}`}>
            Riesgo OMS: {cpodStats.nivelRiesgoOMS}
          </span>
        </div>
        <span className="font-black text-gray-800 text-sm">CPO-D Total: {cpodStats.cpodTotal}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl">
          <span className="text-[10px] text-red-700 font-bold uppercase block">Cariados (C)</span>
          <span className="text-lg font-black text-red-900">{cpodStats.cariados}</span>
        </div>

        <div className="bg-gray-100 border border-gray-300 p-2.5 rounded-xl">
          <span className="text-[10px] text-gray-600 font-bold uppercase block">Perdidos (P)</span>
          <span className="text-lg font-black text-gray-900">{cpodStats.perdidos}</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
          <span className="text-[10px] text-blue-700 font-bold uppercase block">Obturados (O)</span>
          <span className="text-lg font-black text-blue-900">{cpodStats.obturados}</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Sanos / Sin Caries</span>
          <span className="text-lg font-black text-emerald-900">{cpodStats.sanos}</span>
        </div>
      </div>
    </div>
  )
})

CpodSummaryCard.displayName = 'CpodSummaryCard'