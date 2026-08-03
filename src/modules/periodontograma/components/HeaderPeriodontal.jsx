import React, { memo } from 'react'

export const HeaderPeriodontal = memo(({ metricas, resumenClinico }) => {
  return (
    <div className="space-y-4">
      {/* Dashboard de Métricas en Tiempo Real */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            Periodontograma Clínico Avanzado (6 Puntos)
          </h3>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Registro de PB, REC, CAL automático, BOP, Placa, Supuración, Movilidad y Furca.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-center min-w-[85px]">
            <span className="text-[9px] uppercase font-bold text-red-700 block">BOP %</span>
            <span className="text-xl font-extrabold text-red-900">{metricas.porcentajeBop}%</span>
          </div>

          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center min-w-[85px]">
            <span className="text-[9px] uppercase font-bold text-blue-700 block">Placa %</span>
            <span className="text-xl font-extrabold text-blue-900">{metricas.porcentajePlaca}%</span>
          </div>

          <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-center min-w-[85px]">
            <span className="text-[9px] uppercase font-bold text-yellow-800 block">Supuración</span>
            <span className="text-xl font-extrabold text-yellow-900">{metricas.porcentajeSupuracion}%</span>
          </div>

          <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-center min-w-[85px]">
            <span className="text-[9px] uppercase font-bold text-orange-700 block">≥4 mm</span>
            <span className="text-xl font-extrabold text-orange-900">{metricas.sacosModerados}</span>
          </div>

          <div className="p-2.5 bg-red-100 border border-red-300 rounded-xl text-center min-w-[85px]">
            <span className="text-[9px] uppercase font-bold text-red-800 block">≥6 mm</span>
            <span className="text-xl font-extrabold text-red-950">{metricas.sacosSeveros}</span>
          </div>

          <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center min-w-[85px]">
            <span className="text-[9px] uppercase font-bold text-gray-700 block">Máx / Prom</span>
            <span className="text-base font-extrabold text-gray-900">{metricas.profundidadMaxima} / {metricas.promedioSondaje}m</span>
          </div>

          <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center min-w-[85px]">
            <span className="text-[9px] uppercase font-bold text-gray-700 block">Eval / Aus</span>
            <span className="text-base font-extrabold text-gray-900">{metricas.dientesEvaluados} / {metricas.dientesAusentes}</span>
          </div>

          <button 
            onClick={() => window.print()} 
            className="bg-black text-white font-bold px-4 py-3 rounded-xl hover:bg-gray-800 shadow-xs cursor-pointer text-xs"
          >
            🖨️ PDF
          </button>
        </div>
      </div>

      {/* Resumen Clínico Descriptivo Objetivo */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider mb-1">
          📋 Resumen de Hallazgos Clínicos Registrados:
        </h4>
        <p className="text-xs text-gray-700 leading-relaxed italic">
          "{resumenClinico}"
        </p>
      </div>
    </div>
  )
})

HeaderPeriodontal.displayName = 'HeaderPeriodontal'