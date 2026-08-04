import React, { memo, useState } from 'react'
import { OPCIONES_CUOTAS } from '../constants/presupuestosConstants'
import { calcularSimulacionCuotas } from '../utils/presupuestosCalculations'

export const DocumentoPresupuestoImprimible = memo(({ presupuesto, userProfile, alCerrar }) => {
  const [pieInicial, setPieInicial] = useState(0)
  const [numCuotas, setNumCuotas] = useState(3)

  if (!presupuesto) return null

  const montoTotal = parseFloat(presupuesto.montoTotal) || 0
  const montoAbonado = parseFloat(presupuesto.montoAbonado) || 0
  const saldoPendiente = Math.max(0, montoTotal - montoAbonado)

  const simulacion = calcularSimulacionCuotas(saldoPendiente, pieInicial, numCuotas)

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-between items-center print:hidden bg-gray-50 p-4 border rounded-2xl">
        <span className="font-bold text-xs text-gray-700">Folio Cotización: <strong>{presupuesto.folio}</strong></span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800"
          >
            🖨️ Imprimir Carta Presupuesto (PDF)
          </button>
          <button
            onClick={alCerrar}
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Simulador de Cuotas para Imprimir */}
      <div className="bg-gray-50 p-4 border rounded-2xl print:hidden space-y-3">
        <h4 className="font-bold text-gray-800 uppercase">💳 Simulador de Financiamiento en Cuotas</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Pie / Abono Inicial ($)</label>
            <input
              type="number"
              value={pieInicial}
              onChange={(e) => setPieInicial(e.target.value)}
              className="w-full p-2 rounded-lg border bg-white font-bold"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Número de Cuotas</label>
            <select
              value={numCuotas}
              onChange={(e) => setNumCuotas(parseInt(e.target.value))}
              className="w-full p-2 rounded-lg border bg-white font-bold"
            >
              {OPCIONES_CUOTAS.map(c => <option key={c.cuotas} value={c.cuotas}>{c.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border flex justify-between items-center font-bold text-emerald-900">
          <span>Saldo a Financiar: ${simulacion.saldoFinanciar.toLocaleString('es-CL')} CLP</span>
          <span>{numCuotas} Cuotas de: ${simulacion.valorCuota.toLocaleString('es-CL')} CLP / mes</span>
        </div>
      </div>

      {/* CARTA DE PRESUPUESTO OFICIAL MEMBRETADA */}
      <div className="bg-white border border-gray-300 rounded-2xl p-8 print:border-none print:p-0 text-gray-900 space-y-6">
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-base font-black uppercase tracking-wider">Plan de Tratamiento & Presupuesto Clínico</h1>
            <p className="text-[10px] text-gray-600 font-bold">{userProfile?.nombreCompleto || 'Cirujano Dentista'} | Studio Dental OS</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black bg-gray-100 px-3 py-1 rounded-lg border border-gray-300 block">{presupuesto.folio}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Emisión: {presupuesto.fechaEmision} (Válido 30 días)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-white print:border">
          <div>
            <p><span className="font-bold">Paciente:</span> {presupuesto.pacienteNombre}</p>
            <p><span className="font-bold">RUT:</span> {presupuesto.pacienteRut}</p>
          </div>
          <div>
            <p><span className="font-bold">Convenio / Previsión:</span> {presupuesto.convenio || 'Particular'}</p>
            <p><span className="font-bold">Estado:</span> {presupuesto.estado}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse border border-gray-200 text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 font-bold uppercase text-[10px]">
              <th className="p-2.5 border">Pieza</th>
              <th className="p-2.5 border">Procedimiento Prescrito</th>
              <th className="p-2.5 border text-right">Valor Final ($)</th>
            </tr>
          </thead>
          <tbody>
            {(presupuesto.items || []).map((it, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2.5 border font-bold">{it.pieza || 'General'}</td>
                <td className="p-2.5 border">{it.prestacion}</td>
                <td className="p-2.5 border text-right font-bold">${(parseFloat(it.valor) || 0).toLocaleString('es-CL')} CLP</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-black pt-3 space-y-1 text-right text-xs">
          <p><span className="text-gray-600">Total Cotizado:</span> <span className="font-bold">${montoTotal.toLocaleString('es-CL')} CLP</span></p>
          <p><span className="text-emerald-700">Abonos Recibidos:</span> <span className="font-bold text-emerald-700">-${montoAbonado.toLocaleString('es-CL')} CLP</span></p>
          <p className="text-sm pt-1"><span className="font-black text-gray-900">Saldo Pendiente:</span> <span className="font-black text-red-600">${saldoPendiente.toLocaleString('es-CL')} CLP</span></p>
        </div>

        {simulacion.numCuotas > 1 && (
          <div className="p-3 bg-gray-50 rounded-xl border text-[11px] space-y-1">
            <h5 className="font-bold text-gray-800 uppercase">Plan de Pagos Facilitado:</h5>
            <p>Pie Inicial: ${parseFloat(pieInicial || 0).toLocaleString('es-CL')} CLP + {simulacion.numCuotas} cuotas mensuales de <strong>${simulacion.valorCuota.toLocaleString('es-CL')} CLP</strong>.</p>
          </div>
        )}

        <div className="pt-16 grid grid-cols-2 gap-8 text-center print:pt-24">
          <div className="border-t border-black pt-2">
            <p className="font-bold">Aceptado por Paciente</p>
            <p className="text-[10px] text-gray-500">Firma y Aceptación de Plan de Pago</p>
          </div>

          <div className="border-t border-black pt-2">
            <p className="font-bold">{userProfile?.nombreCompleto}</p>
            <p className="text-[10px] text-gray-500">Cirujano Dentista / Timbre</p>
          </div>
        </div>
      </div>
    </div>
  )
})

DocumentoPresupuestoImprimible.displayName = 'DocumentoPresupuestoImprimible'