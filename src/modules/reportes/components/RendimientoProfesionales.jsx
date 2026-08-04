import React, { memo } from 'react'

export const RendimientoProfesionales = memo(({ recaudacionPorMetodo = {} }) => {
  const entradasMetodos = Object.entries(recaudacionPorMetodo)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs text-xs space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">💳 Desglose por Medio de Pago & DTE</h3>
        <span className="text-[10px] text-gray-500 font-semibold">Caja & Canales</span>
      </div>

      {entradasMetodos.length === 0 ? (
        <p className="text-gray-400 text-center py-6">No hay transacciones registradas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {entradasMetodos.map(([metodo, monto]) => (
            <div key={metodo} className="p-3 bg-gray-50 border rounded-xl flex justify-between items-center">
              <span className="font-bold text-gray-800">{metodo}:</span>
              <span className="font-black text-emerald-900">${monto.toLocaleString('es-CL')} CLP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

RendimientoProfesionales.displayName = 'RendimientoProfesionales'