import React, { memo } from 'react'
import { formatearCLP } from '../utils/finanzasCalculations'
import { Trash2 } from 'lucide-react'

const esIngreso = (m) => (m.tipo || '').toLowerCase() === 'ingreso'

export const TablaMovimientos = memo(({ movimientos, onEliminar }) => {
  if (movimientos.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-gray-400 dark:text-graphite-500 bg-white dark:bg-graphite-800 border rounded-2xl">
        No hay registros de movimientos de caja en el período.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-graphite-800 border-b border-gray-200 dark:border-graphite-700 text-gray-700 dark:text-graphite-300 font-bold uppercase text-[10px]">
            <th className="p-3">Fecha</th>
            <th className="p-3">Tipo</th>
            <th className="p-3">Categoría / Detalle</th>
            <th className="p-3">Método Pago</th>
            <th className="p-3 text-right">Monto</th>
            <th className="p-3 text-center print:hidden">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-graphite-800">
          {movimientos.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-graphite-700 dark:hover:bg-graphite-700 transition-colors">
              <td className="p-3 font-semibold text-gray-600 dark:text-graphite-400">{m.fecha}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                  esIngreso(m) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {esIngreso(m) ? 'INGRESO' : 'EGRESO'}
                </span>
              </td>
              <td className="p-3 font-bold text-gray-800 dark:text-graphite-100">
                {m.categoria} {m.detalle && <span className="font-normal text-gray-500 dark:text-graphite-400">({m.detalle})</span>}
              </td>
              <td className="p-3 font-medium text-gray-600 dark:text-graphite-400">{m.metodoPago}</td>
              <td className={`p-3 text-right font-black ${esIngreso(m) ? 'text-emerald-700' : 'text-red-700'}`}>
                {esIngreso(m) ? '+' : '-'}{formatearCLP(m.monto)}
              </td>
              <td className="p-3 text-center print:hidden">
                <button
                  onClick={() => onEliminar(m.id)}
                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50"
                >
                  <Trash2 size={12} />
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