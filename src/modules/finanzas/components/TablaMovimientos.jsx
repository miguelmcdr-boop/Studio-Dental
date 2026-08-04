import React, { memo } from 'react'
import { formatearCLP } from '../utils/finanzasCalculations'

export const TablaMovimientos = memo(({ movimientos, onEliminar }) => {
  if (movimientos.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-gray-400 bg-white border rounded-2xl">
        No hay registros de movimientos de caja en el período.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
            <th className="p-3">Fecha</th>
            <th className="p-3">Tipo</th>
            <th className="p-3">Categoría / Detalle</th>
            <th className="p-3">Método Pago</th>
            <th className="p-3 text-right">Monto</th>
            <th className="p-3 text-center print:hidden">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {movimientos.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
              <td className="p-3 font-semibold text-gray-600">{m.fecha}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                  m.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {m.tipo === 'ingreso' ? '🟢 INGRESO' : '🔴 EGRESO'}
                </span>
              </td>
              <td className="p-3 font-bold text-gray-800">
                {m.categoria} {m.detalle && <span className="font-normal text-gray-500">({m.detalle})</span>}
              </td>
              <td className="p-3 font-medium text-gray-600">{m.metodoPago}</td>
              <td className={`p-3 text-right font-black ${m.tipo === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}`}>
                {m.tipo === 'ingreso' ? '+' : '-'}{formatearCLP(m.monto)}
              </td>
              <td className="p-3 text-center print:hidden">
                <button
                  onClick={() => onEliminar(m.id)}
                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

TablaMovimientos.displayName = 'TablaMovimientos'