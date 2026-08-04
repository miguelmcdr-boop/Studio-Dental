import React, { memo } from 'react'

export const TablaHistorialPagos = memo(({ pagos, onVerComprobante, onEditar, onAnular }) => {
  if (pagos.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl">
        No se encontraron transacciones registradas para los criterios seleccionados.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
            <th className="p-3">Recibo / DTE SII</th>
            <th className="p-3">Paciente / RUT</th>
            <th className="p-3">Fecha / Hora</th>
            <th className="p-3">Concepto & Imputación</th>
            <th className="p-3">Medio de Pago</th>
            <th className="p-3 text-[10px] text-center">Estado</th>
            <th className="p-3 text-right">Monto ($ CLP)</th>
            <th className="p-3 text-right print:hidden">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pagos.map((p) => {
            const esAnulado = p.estado === 'Anulado'

            return (
              <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${esAnulado ? 'bg-red-50/40' : ''}`}>
                <td className="p-3">
                  <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-300 font-mono text-[11px] font-bold block w-max">
                    {p.folioComprobante}
                  </span>
                  {p.folioDTE && (
                    <span className="text-[10px] font-bold text-blue-800 block mt-0.5">
                      DTE: {p.folioDTE}
                    </span>
                  )}
                </td>

                <td className="p-3">
                  <span className="font-extrabold text-gray-900 block">{p.pacienteNombre}</span>
                  <span className="text-[10px] text-gray-500">RUT: {p.pacienteRut}</span>
                </td>

                <td className="p-3 font-semibold text-gray-700">
                  {p.fecha} <span className="text-gray-400 font-normal block">{p.hora} hrs</span>
                </td>

                <td className="p-3">
                  <span className="font-bold text-gray-800 block">{p.concepto}</span>
                  {p.prestacionesImputadas && p.prestacionesImputadas.length > 0 && (
                    <span className="text-[10px] text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 inline-block mt-0.5">
                      {p.prestacionesImputadas.join(', ')}
                    </span>
                  )}
                </td>

                <td className="p-3">
                  <span className="bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-xl border border-emerald-200 font-bold text-[10px]">
                    {p.metodoPago}
                  </span>
                </td>

                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] border ${
                    esAnulado ? 'bg-red-100 text-red-900 border-red-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {esAnulado ? '🔴 Anulado' : '🟢 Vigente'}
                  </span>
                </td>

                <td className={`p-3 text-right font-black text-sm ${esAnulado ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  ${(parseFloat(p.monto) || 0).toLocaleString('es-CL')} CLP
                </td>

                <td className="p-3 text-right print:hidden space-x-1">
                  <button
                    onClick={() => onVerComprobante(p)}
                    className="p-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800"
                    title="Ver / Imprimir Comprobante Oficial"
                  >
                    🧾 Recibo
                  </button>

                  {!esAnulado && (
                    <>
                      <button
                        onClick={() => onEditar(p)}
                        className="p-1.5 text-gray-600 hover:text-black font-semibold rounded-lg hover:bg-gray-100"
                        title="Editar pago"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => onAnular(p.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 font-semibold rounded-lg hover:bg-red-50"
                        title="Anular pago"
                      >
                        🚫
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

TablaHistorialPagos.displayName = 'TablaHistorialPagos'