import React, { memo, useState } from 'react'
import { formatearCLP } from '../utils/finanzasCalculations'

export const ArqueoCajaDiario = memo(({ balance, alCerrarCaja, cierresAnteriores = [] }) => {
  const [montoAperturaEfectivo, setMontoAperturaEfectivo] = useState(50000) // Fondo inicial de caja
  const [efectivoContadoReal, setEfectivoContadoReal] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const efectivoEsperado = balance.totalEfectivo + parseFloat(montoAperturaEfectivo || 0)
  const efectivoRealNum = parseFloat(efectivoContadoReal) || 0
  const diferenciaCuadre = efectivoRealNum - efectivoEsperado

  const handleGuardarArqueo = (e) => {
    e.preventDefault()
    if (!efectivoContadoReal) {
      alert('Ingresa la cantidad de efectivo contado físicamente en la caja.')
      return
    }

    const nuevoCierre = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      montoAperturaEfectivo: parseFloat(montoAperturaEfectivo),
      totalIngresosDia: balance.totalIngresos,
      totalEgresosDia: balance.totalEgresos,
      efectivoEsperado,
      efectivoReal: efectivoRealNum,
      diferencia: diferenciaCuadre,
      totalTarjetas: balance.totalTarjetas,
      totalTransferencias: balance.totalTransferencias,
      observaciones
    }

    alCerrarCaja(nuevoCierre)
    alert('✅ Cierre y Arqueo de Caja registrado exitosamente.')
    setEfectivoContadoReal('')
    setObservaciones('')
  }

  return (
    <div className="space-y-6 text-xs">
      <form onSubmit={handleGuardarArqueo} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b pb-2 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
              🔒 Arqueo y Cierre de Caja Diario (Cuadre de Turno)
            </h3>
            <p className="text-gray-500 text-[11px]">
              Verificación física de billetes y monedas vs. registros del sistema.
            </p>
          </div>
          <span className="font-black bg-black text-white px-3 py-1 rounded-xl text-xs">
            {new Date().toLocaleDateString('es-CL')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Monto Inicial Apertura ($ CLP)</label>
            <input
              type="number"
              value={montoAperturaEfectivo}
              onChange={(e) => setMontoAperturaEfectivo(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-white"
            />
            <span className="text-[10px] text-gray-400">Fondo de sencillo para vuelto.</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Efectivo Sistema Esperado</label>
            <div className="p-2.5 rounded-xl border bg-white font-black text-sm text-gray-900">
              {formatearCLP(efectivoEsperado)}
            </div>
            <span className="text-[10px] text-gray-400">Apertura + Ingresos - Egresos efectivo.</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Efectivo Físico Contado *</label>
            <input
              type="number"
              required
              placeholder="Ej: 185000"
              value={efectivoContadoReal}
              onChange={(e) => setEfectivoContadoReal(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-black text-sm bg-white text-emerald-900"
            />
            <span className="text-[10px] text-gray-400">Total en billetes y monedas.</span>
          </div>
        </div>

        {efectivoContadoReal !== '' && (
          <div className={`p-4 rounded-2xl border flex justify-between items-center font-bold ${
            diferenciaCuadre === 0 ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
            diferenciaCuadre > 0 ? 'bg-blue-50 text-blue-900 border-blue-300' : 'bg-red-50 text-red-900 border-red-300'
          }`}>
            <span>
              {diferenciaCuadre === 0 ? '🟢 Caja Perfectamente Cuadrada' :
               diferenciaCuadre > 0 ? '🔵 Sobrante de Caja:' : '🔴 Faltante de Caja:'}
            </span>
            <span className="text-base font-black">{formatearCLP(diferenciaCuadre)}</span>
          </div>
        )}

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Observaciones del Cierre de Caja</label>
          <input
            type="text"
            placeholder="Ej: Todo cuadrado sin novedades. Voucher Transbank adjunto al sobre..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer shadow-xs"
        >
          🔒 Realizar Arqueo y Guardar Cierre de Caja
        </button>
      </form>

      {/* Historial de Cierres de Caja */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-gray-50 border-b font-bold text-gray-800 uppercase tracking-wider">
          Historial de Cierres de Caja Anteriores ({cierresAnteriores.length})
        </div>

        {cierresAnteriores.length === 0 ? (
          <p className="p-6 text-center text-gray-400">No hay cierres de caja guardados aún.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b text-gray-700 font-bold uppercase text-[10px]">
                <th className="p-3">Fecha / Hora</th>
                <th className="p-3">Efectivo Esperado</th>
                <th className="p-3">Efectivo Contado</th>
                <th className="p-3 text-center">Cuadre</th>
                <th className="p-3 text-right">Tarjetas / POS</th>
                <th className="p-3 text-right">Transferencias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cierresAnteriores.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-900">{c.fecha} {c.hora}</td>
                  <td className="p-3 text-gray-700 font-semibold">{formatearCLP(c.efectivoEsperado)}</td>
                  <td className="p-3 font-black text-gray-900">{formatearCLP(c.efectivoReal)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      c.diferencia === 0 ? 'bg-emerald-100 text-emerald-900' :
                      c.diferencia > 0 ? 'bg-blue-100 text-blue-900' : 'bg-red-100 text-red-900'
                    }`}>
                      {c.diferencia === 0 ? 'OK' : formatearCLP(c.diferencia)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-gray-800">{formatearCLP(c.totalTarjetas)}</td>
                  <td className="p-3 text-right font-bold text-gray-800">{formatearCLP(c.totalTransferencias)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
})

ArqueoCajaDiario.displayName = 'ArqueoCajaDiario'