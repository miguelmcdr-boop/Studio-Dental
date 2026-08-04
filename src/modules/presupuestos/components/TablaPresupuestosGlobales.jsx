import React, { memo } from 'react'
import { ESTADOS_PRESUPUESTO } from '../constants/presupuestosConstants'

export const TablaPresupuestosGlobales = memo(({
  presupuestos,
  onCambiarEstado,
  onVerFichaPaciente,
  onVerDocumento,
  onEliminar
}) => {
  if (presupuestos.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl">
        No hay presupuestos o cotizaciones registradas para el criterio seleccionado.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
            <th className="p-3">Folio / Paciente</th>
            <th className="p-3">Emisión / Convenio</th>
            <th className="p-3 text-center">Estado Comercial</th>
            <th className="p-3 text-right">Monto Cotizado</th>
            <th className="p-3 text-right">Abonado</th>
            <th className="p-3 text-right">Saldo Pendiente</th>
            <th className="p-3 text-right print:hidden">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {presupuestos.map((p) => {
            const configEstado = ESTADOS_PRESUPUESTO.find(e => e.id === p.estado) || ESTADOS_PRESUPUESTO[0]
            const montoTotal = parseFloat(p.montoTotal) || 0
            const montoAbonado = parseFloat(p.montoAbonado) || 0
            const saldo = Math.max(0, montoTotal - montoAbonado)

            return (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-300 font-mono text-[11px] font-bold block w-max">
                    {p.folio}
                  </span>
                  <span className="font-extrabold text-gray-900 block mt-1">{p.pacienteNombre}</span>
                  <span className="text-[10px] text-gray-500">RUT: {p.pacienteRut}</span>
                </td>

                <td className="p-3">
                  <span className="font-semibold text-gray-800 block">{p.fechaEmision}</span>
                  <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-200 font-bold text-[10px] inline-block mt-0.5">
                    {p.convenio || 'Particular'}
                  </span>
                </td>

                <td className="p-3 text-center">
                  <select
                    value={p.estado}
                    onChange={(e) => onCambiarEstado(p.id, e.target.value)}
                    className={`px-2 py-1 rounded-xl font-extrabold text-[10px] border bg-white cursor-pointer ${configEstado.colorText} ${configEstado.colorBorder}`}
                  >
                    {ESTADOS_PRESUPUESTO.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </td>

                <td className="p-3 text-right font-black text-gray-900">
                  ${montoTotal.toLocaleString('es-CL')} CLP
                </td>

                <td className="p-3 text-right font-bold text-emerald-800">
                  ${montoAbonado.toLocaleString('es-CL')} CLP
                </td>

                <td className="p-3 text-right font-black text-red-600">
                  ${saldo.toLocaleString('es-CL')} CLP
                </td>

                <td className="p-3 text-right print:hidden space-x-1">
                  <button
                    onClick={() => onVerDocumento(p)}
                    className="p-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800"
                    title="Imprimir Documento Cotización"
                  >
                    📄 Ver PDF
                  </button>

                  <button
                    onClick={() => onVerFichaPaciente(p)}
                    className="p-1.5 bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold rounded-lg hover:bg-blue-100"
                    title="Ir a Ficha Clínica"
                  >
                    👥 Ficha
                  </button>

                  <button
                    onClick={() => onEliminar(p.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 font-semibold rounded-lg hover:bg-red-50"
                    title="Eliminar presupuesto"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

TablaPresupuestosGlobales.displayName = 'TablaPresupuestosGlobales'