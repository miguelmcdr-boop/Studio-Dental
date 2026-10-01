import React, { memo } from 'react'
import { Tag, Trash2 } from 'lucide-react'

export const TablaCargasEsterilizacion = memo(({ cargas, onSeleccionarImprimir, onEliminar }) => {
  if (cargas.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 dark:text-graphite-500 bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl">
        No se encontraron registros de autoclave para los filtros seleccionados.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-[#E2E8F0] border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] text-gray-700 dark:text-graphite-300 surgical:text-black font-bold uppercase text-[10px]">
            <th className="p-3">Código Lote</th>
            <th className="p-3">Fecha / Hora</th>
            <th className="p-3">Equipo Autoclave</th>
            <th className="p-3">Parámetros</th>
            <th className="p-3">Contenido Carga</th>
            <th className="p-3">Indicador Químico</th>
            <th className="p-3 text-center">Estado</th>
            <th className="p-3 text-right print:hidden">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-graphite-800">
          {cargas.map((c) => {
            const esConforme = c.estado === 'Conforme'

            return (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-graphite-800 surgical:hover:bg-slate-200 transition-colors">
                <td className="p-3 font-black text-gray-900 dark:text-graphite-50 surgical:text-black">
                  <span className="bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-white text-gray-900 dark:text-graphite-50 surgical:text-black px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-mono text-[11px] tabular-nums">{c.lote}</span>
                  <span className="block text-[10px] text-gray-500 dark:text-graphite-400 surgical:text-graphite-600 font-normal mt-0.5">Resp: {c.responsable}</span>
                </td>

                <td className="p-3 font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black tabular-nums">
                  {c.fecha} <span className="text-gray-400 dark:text-graphite-500 surgical:text-graphite-600 font-normal block">{c.hora} hrs</span>
                </td>

                <td className="p-3 font-bold text-gray-800 dark:text-graphite-100 surgical:text-black">{c.equipo}</td>

                <td className="p-3 tabular-nums">
                  <span className="font-bold text-blue-900 dark:text-sky-300 surgical:text-black block">{c.temperatura}°C / {c.presion} Bar</span>
                  <span className="text-[10px] text-gray-500 dark:text-graphite-400 surgical:text-graphite-600">{c.tiempoMinutos} min exposición</span>
                </td>

                <td className="p-3 font-medium text-gray-700 dark:text-graphite-300 surgical:text-black max-w-xs truncate" title={c.contenido}>
                  {c.contenido}
                </td>

                <td className="p-3">
                  <span className="font-semibold text-gray-800 dark:text-graphite-100 surgical:text-black">{c.indicadorQuimico}</span>
                  <span className="block text-[10px] text-gray-500 dark:text-graphite-400 surgical:text-graphite-600">{c.indicadorBiologico}</span>
                </td>

                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${
                    esConforme
                      ? 'bg-clinical-success/15 text-clinical-success dark:text-emerald-300 border border-clinical-success/30 surgical:bg-white surgical:text-black surgical:border-[#475569]'
                      : 'bg-clinical-error/15 text-clinical-error dark:text-red-300 border border-clinical-error/30 surgical:bg-white surgical:text-black surgical:border-[#475569]'
                  }`}>
                    {esConforme ? 'CONFORME' : 'RECHAZADO'}
                  </span>
                </td>

                <td className="p-3 text-right print:hidden space-x-1">
                  <button
                    onClick={() => onSeleccionarImprimir(c)}
                    className="p-1.5 bg-slate-900 dark:bg-gold-solid surgical:bg-black text-white dark:text-black surgical:text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-opacity"
                    title="Imprimir Tique de Trazabilidad"
                  >
                    <span className="inline-flex items-center gap-1"><Tag size={10} />Tique</span>
                  </button>
                  <button
                    onClick={() => onEliminar(c.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                    title="Eliminar ciclo"
                  >
                    <Trash2 size={12} />
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

TablaCargasEsterilizacion.displayName = 'TablaCargasEsterilizacion'