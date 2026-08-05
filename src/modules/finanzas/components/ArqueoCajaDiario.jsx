import React, { memo } from 'react'

export const ArqueoCajaDiario = memo(({
  transaccionesDia = [],
  fechaArqueo,
  setFechaArqueo,
  userProfile
}) => {
  const ingresos = transaccionesDia.filter(t => t.tipo === 'Ingreso')
  const egresos = transaccionesDia.filter(t => t.tipo === 'Egreso')

  const totalIngresos = ingresos.reduce((acc, curr) => acc + (curr.monto || 0), 0)
  const totalEgresos = egresos.reduce((acc, curr) => acc + (curr.monto || 0), 0)
  const saldoFinalCaja = totalIngresos - totalEgresos

  // Desglose por Medio de Pago
  const efectivo = transaccionesDia
    .filter(t => t.metodoPago === 'Efectivo' && t.tipo === 'Ingreso')
    .reduce((acc, curr) => acc + (curr.monto || 0), 0)

  const transferencia = transaccionesDia
    .filter(t => t.metodoPago === 'Transferencia' && t.tipo === 'Ingreso')
    .reduce((acc, curr) => acc + (curr.monto || 0), 0)

  const debito = transaccionesDia
    .filter(t => t.metodoPago === 'Débito' && t.tipo === 'Ingreso')
    .reduce((acc, curr) => acc + (curr.monto || 0), 0)

  const credito = transaccionesDia
    .filter(t => t.metodoPago === 'Crédito' && t.tipo === 'Ingreso')
    .reduce((acc, curr) => acc + (curr.monto || 0), 0)

  return (
    <div className="space-y-6">
      {/* Selector de Fecha e Impresión */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200 print:hidden flex-wrap gap-3">
        <div className="flex items-center gap-3 text-xs">
          <label className="font-bold text-gray-700">Seleccionar Fecha de Arqueo:</label>
          <input
            type="text"
            placeholder="DD/MM/AAAA"
            value={fechaArqueo}
            onChange={(e) => setFechaArqueo(e.target.value)}
            className="px-3 py-1.5 border rounded-lg bg-white font-bold text-gray-900 w-32"
          />
        </div>

        <button
          onClick={() => window.print()}
          className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-800 shadow-sm flex items-center gap-2"
        >
          🖨️ Imprimir Cierre de Caja A4
        </button>
      </div>

      {/* Documento de Cierre de Caja Imprimible */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-none print:p-0">
        {/* Encabezado */}
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{userProfile?.nombreCompleto || 'Studio Dental'}</h1>
            <p className="text-xs text-gray-600">Arqueo y Cierre Diario de Caja Chica</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-800 uppercase">INFORME DE CAJA</h2>
            <p className="text-xs text-gray-500">Fecha Arqueo: <strong>{fechaArqueo}</strong></p>
          </div>
        </div>

        {/* KPI Summaries de Caja */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
            <span className="text-emerald-700 font-bold block uppercase text-[10px]">Total Ingresos Día</span>
            <span className="text-xl font-extrabold text-emerald-900">${totalIngresos.toLocaleString('es-CL')} CLP</span>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <span className="text-red-700 font-bold block uppercase text-[10px]">Total Egresos / Gastos Día</span>
            <span className="text-xl font-extrabold text-red-900">-${totalEgresos.toLocaleString('es-CL')} CLP</span>
          </div>

          <div className="bg-gray-900 text-white p-4 rounded-xl">
            <span className="text-gray-300 font-bold block uppercase text-[10px]">Saldo Neto en Caja</span>
            <span className="text-xl font-extrabold text-white">${saldoFinalCaja.toLocaleString('es-CL')} CLP</span>
          </div>
        </div>

        {/* Desglose por Medio de Pago */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
            💳 Desglose de Ingresos por Medio de Pago
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border">
              <span className="text-gray-500 block text-[10px]">💵 Efectivo:</span>
              <span className="font-bold text-gray-900">${efectivo.toLocaleString('es-CL')}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <span className="text-gray-500 block text-[10px]">🏦 Transferencia:</span>
              <span className="font-bold text-gray-900">${transferencia.toLocaleString('es-CL')}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <span className="text-gray-500 block text-[10px]">💳 Débito:</span>
              <span className="font-bold text-gray-900">${debito.toLocaleString('es-CL')}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <span className="text-gray-500 block text-[10px]">💳 Crédito:</span>
              <span className="font-bold text-gray-900">${credito.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>

        {/* Tabla de Movimientos del Día */}
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
          📋 Detalle de Transacciones del Día ({transaccionesDia.length})
        </h4>

        {transaccionesDia.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed">
            No existen transacciones ni cobros registrados para la fecha {fechaArqueo}.
          </p>
        ) : (
          <table className="w-full text-left text-xs mb-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-100 text-gray-800">
                <th className="p-2.5">Origen / Categoría</th>
                <th className="p-2.5">Paciente / Detalle</th>
                <th className="p-2.5">Medio de Pago</th>
                <th className="p-2.5 text-center">Tipo</th>
                <th className="p-2.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {transaccionesDia.map(t => (
                <tr key={t.id} className="border-b border-gray-200">
                  <td className="p-2.5 font-bold text-gray-900">{t.categoria || 'General'}</td>
                  <td className="p-2.5 text-gray-700">{t.pacienteNombre || t.concepto || 'S/D'}</td>
                  <td className="p-2.5 font-semibold text-gray-600">{t.metodoPago || 'Efectivo'}</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.tipo === 'Ingreso' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className={`p-2.5 text-right font-bold ${
                    t.tipo === 'Ingreso' ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {t.tipo === 'Ingreso' ? '+' : '-'}${Math.abs(t.monto).toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pie de Firma Contable */}
        <div className="hidden print:block mt-16 pt-8 border-t border-gray-300 text-center text-xs">
          <div className="w-64 mx-auto border-t border-black pt-2">
            <p className="font-bold">{userProfile?.nombreCompleto || 'Firma Responsable de Caja'}</p>
            <p className="text-gray-500 text-[10px]">Recepción & Arqueo de Caja</p>
          </div>
        </div>
      </div>
    </div>
  )
})

ArqueoCajaDiario.displayName = 'ArqueoCajaDiario'