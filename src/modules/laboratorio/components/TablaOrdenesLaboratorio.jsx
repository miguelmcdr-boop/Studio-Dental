import React, { memo } from 'react'
import { ETAPAS_LABORATORIO } from '../constants/laboratorioConstants'

export const TablaOrdenesLaboratorio = memo(({ ordenes, onActualizarEtapa, onCambiarPago, onSeleccionarImprimir, onEliminar }) => {
  if (ordenes.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl">
        No se encontraron trabajos de laboratorio registrados con los criterios seleccionados.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
            <th className="p-3">Código / Paciente</th>
            <th className="p-3">Trabajo / Pieza</th>
            <th className="p-3">Laboratorio Proveedor</th>
            <th className="p-3">Fechas (Envío / Promesa)</th>
            <th className="p-3 text-center">Etapa Actual</th>
            <th className="p-3 text-right">Costo / Estado Pago</th>
            <th className="p-3 text-right print:hidden">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ordenes.map((o) => {
            const etapaConfig = ETAPAS_LABORATORIO.find(e => e.id === o.etapa) || ETAPAS_LABORATORIO[0]
            const estaPagado = o.estadoPagoLab === 'Pagado'

            return (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-300 font-mono text-[11px] font-bold block w-max">
                    {o.codigoOrden}
                  </span>
                  <span className="font-extrabold text-gray-900 block mt-1">{o.pacienteNombre}</span>
                  <span className="text-[10px] text-gray-500">RUT: {o.pacienteRut}</span>
                </td>

                <td className="p-3">
                  <span className="font-bold text-gray-900 block">{o.tipoTrabajo}</span>
                  <span className="text-[11px] font-semibold text-blue-900 block">{o.piezaDientaria}</span>
                  <span className="text-[10px] text-gray-500">Color: {o.colorGuia || 'N/I'}</span>
                </td>

                <td className="p-3 font-semibold text-gray-800">{o.laboratorioNombre}</td>

                <td className="p-3">
                  <span className="text-gray-600 block"><strong className="text-gray-800">Envío:</strong> {o.fechaEnvio}</span>
                  <span className="text-gray-600 block"><strong className="text-emerald-800">Promesa:</strong> {o.fechaEntregaPrometida}</span>
                </td>

                <td className="p-3 text-center">
                  <select
                    value={o.etapa}
                    onChange={(e) => onActualizarEtapa(o.id, e.target.value)}
                    className={`px-2.5 py-1 rounded-xl font-extrabold text-[11px] border bg-white ${etapaConfig.colorText} ${etapaConfig.colorBorder}`}
                  >
                    {ETAPAS_LABORATORIO.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </td>

                <td className="p-3 text-right">
                  <span className="font-black text-gray-900 block">${(parseFloat(o.costoLaboratorio) || 0).toLocaleString('es-CL')} CLP</span>
                  <button
                    onClick={() => onCambiarPago(o.id, estaPagado ? 'Pendiente' : 'Pagado')}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold mt-1 border transition-all ${
                      estaPagado ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {estaPagado ? '🟢 PAGADO' : '🟡 PENDIENTE PAGO'}
                  </button>
                </td>

                <td className="p-3 text-right print:hidden space-x-1">
                  <button
                    onClick={() => onSeleccionarImprimir(o)}
                    className="p-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800"
                    title="Imprimir Orden de Trabajo"
                  >
                    📄 Orden
                  </button>
                  <button
                    onClick={() => onEliminar(o.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 font-semibold rounded-lg hover:bg-red-50"
                    title="Eliminar trabajo"
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

TablaOrdenesLaboratorio.displayName = 'TablaOrdenesLaboratorio'