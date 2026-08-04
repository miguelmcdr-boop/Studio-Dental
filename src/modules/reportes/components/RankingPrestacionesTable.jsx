import React, { memo } from 'react'

export const RankingPrestacionesTable = memo(({ topPrestaciones = [] }) => {
  if (topPrestaciones.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-gray-400 bg-white border rounded-2xl">
        Sin datos suficientes para generar el ranking de procedimientos.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs text-xs space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">🏆 Top Procedimientos más Rentables</h3>
        <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">Por Ingreso Generado</span>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b text-gray-700 font-bold uppercase text-[10px]">
            <th className="p-2.5">Procedimiento</th>
            <th className="p-2.5 text-center">N° Cantidad</th>
            <th className="p-2.5 text-right">Monto Acumulado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {topPrestaciones.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="p-2.5 font-bold text-gray-900">
                <span className="text-gray-400 font-mono mr-1.5">#{index + 1}</span>
                {item.nombre}
              </td>
              <td className="p-2.5 text-center font-semibold text-gray-700">
                <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded-lg border border-blue-200 font-bold">
                  {item.cantidad} u.
                </span>
              </td>
              <td className="p-2.5 text-right font-black text-emerald-900">${item.montoTotal.toLocaleString('es-CL')} CLP</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

RankingPrestacionesTable.displayName = 'RankingPrestacionesTable'