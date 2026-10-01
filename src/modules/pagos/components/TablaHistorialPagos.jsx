import React, { memo } from 'react'
import { Receipt, Ban } from 'lucide-react'
import { Pencil, Trash2 } from 'lucide-react'

export const TablaHistorialPagos = memo(({ pagos, onVerComprobante, onEditar, onAnular, onPurgar, puedePurgar }) => {
  if (pagos.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 dark:text-graphite-500 bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl">
        No se encontraron transacciones registradas para los criterios seleccionados.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-[#070B14] surgical:bg-[#E2E8F0] border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] text-graphite-600 dark:text-graphite-300 surgical:text-black font-bold uppercase text-[10px]">
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
        <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#24334A] surgical:divide-[#475569]">
          {pagos.map((p) => {
            const esAnulado = p.estado === 'Anulado'
            const esPurgado = p.estado === 'Purgado'

            return (
              <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 surgical:hover:bg-[#E2E8F0] transition-colors ${esPurgado ? 'bg-slate-100/60 dark:bg-[#070B14]/60 surgical:bg-[#CBD5E1]/60' : esAnulado ? 'bg-red-50/40 dark:bg-red-950/20' : ''}`}>
                <td className="p-3">
                  <span className="bg-slate-100 dark:bg-[#1E293B] surgical:bg-[#E2E8F0] px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#24334A] font-mono text-[11px] font-bold block w-max tabular-nums text-graphite-800 dark:text-graphite-200 surgical:text-black">
                    {p.folioComprobante}
                  </span>
                  {p.folioDTE && (
                    <span className="text-[10px] font-bold text-[#7A591F] dark:text-[#E5C378] surgical:text-black block mt-0.5 tabular-nums">
                      DTE: {p.folioDTE}
                    </span>
                  )}
                </td>

                <td className="p-3">
                  <span className="font-extrabold text-graphite-900 dark:text-graphite-50 surgical:text-black block">{p.pacienteNombre}</span>
                  <span className="text-[10px] text-graphite-500 dark:text-graphite-400 surgical:text-black tabular-nums">RUT: {p.pacienteRut}</span>
                </td>

                <td className="p-3 font-semibold text-graphite-700 dark:text-graphite-300 surgical:text-black tabular-nums">
                  {p.fecha} <span className="text-graphite-400 dark:text-graphite-500 font-normal block">{p.hora} hrs</span>
                </td>

                <td className="p-3">
                  <span className="font-bold text-graphite-800 dark:text-graphite-100 surgical:text-black block">{p.concepto}</span>
                  {p.prestacionesImputadas && p.prestacionesImputadas.length > 0 && (
                    <span className="text-[10px] text-indigo-900 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 inline-block mt-0.5">
                      {p.prestacionesImputadas.join(', ')}
                    </span>
                  )}
                </td>

                <td className="p-3">
                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold text-[10px]">
                    {p.metodoPago}
                  </span>
                </td>

                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] border ${
                    esPurgado ? 'bg-slate-200 dark:bg-[#1E293B] text-slate-600 dark:text-slate-400 border-slate-400 dark:border-slate-700' : esAnulado ? 'bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-300 border-red-300 dark:border-red-800' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  }`}>
                    {esPurgado ? 'Purgado' : esAnulado ? 'Anulado' : 'Vigente'}
                  </span>
                </td>

                <td className={`p-3 text-right font-black text-sm tabular-nums ${esPurgado ? 'line-through text-graphite-500 opacity-60' : esAnulado ? 'line-through text-graphite-400' : 'text-graphite-900 dark:text-graphite-50 surgical:text-black'}`}>
                  ${(parseFloat(p.monto) || 0).toLocaleString('es-CL')} CLP
                </td>

                <td className="p-3 text-right print:hidden space-x-1 whitespace-nowrap">
                  <button
                    onClick={() => onVerComprobante(p)}
                    className="p-1.5 bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 surgical:bg-black surgical:text-white text-[10px] font-bold rounded-lg transition-micro cursor-pointer"
                    title="Ver / Imprimir Comprobante Oficial"
                  >
                    <span className="inline-flex items-center gap-1"><Receipt size={14} />Recibo</span>
                  </button>

                  {!esAnulado && !esPurgado && (
                    <>
                      <button
                        onClick={() => onEditar(p)}
                        className="p-1.5 text-graphite-600 dark:text-graphite-400 hover:text-black dark:hover:text-white font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-micro cursor-pointer"
                        title="Editar pago"
                      >
                        <Pencil size={12} />
                      </button>

                      <button
                        onClick={() => onAnular(p.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-micro cursor-pointer"
                        title="Anular pago"
                      >
                        <Ban size={14} />
                      </button>
                    </>
                  )}
                  {esAnulado && puedePurgar && onPurgar && (
                    <button
                      onClick={() => onPurgar(p)}
                      className="p-1.5 bg-red-900 hover:bg-red-950 text-white text-[10px] font-bold rounded-lg transition-micro cursor-pointer"
                      title="Purgar definitivamente (solo admin)"
                    >
                      <span className="inline-flex items-center gap-1"><Trash2 size={12} />Purgar</span>
                    </button>
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