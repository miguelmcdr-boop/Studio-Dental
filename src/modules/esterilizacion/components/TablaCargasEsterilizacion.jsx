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
    <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-graphite-800 border-b border-gray-200 dark:border-graphite-700 text-gray-700 dark:text-graphite-300 font-bold uppercase text-[10px]">
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
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-graphite-700 dark:hover:bg-graphite-700 transition-colors">
                <td className="p-3 font-black text-gray-900 dark:text-graphite-50">
                  <span className="bg-gray-100 dark:bg-graphite-800 px-2 py-0.5 rounded border border-gray-300 dark:border-graphite-600 font-mono text-[11px]">{c.lote}</span>
                  <span className="block text-[10px] text-gray-500 dark:text-graphite-400 font-normal mt-0.5">Resp: {c.responsable}</span>
                </td>

                <td className="p-3 font-semibold text-gray-700 dark:text-graphite-300">
                  {c.fecha} <span className="text-gray-400 dark:text-graphite-500 font-normal block">{c.hora} hrs</span>
                </td>

                <td className="p-3 font-bold text-gray-800 dark:text-graphite-100">{c.equipo}</td>

                <td className="p-3">
                  <span className="font-bold text-blue-900 block">{c.temperatura}°C / {c.presion} Bar</span>
                  <span className="text-[10px] text-gray-500 dark:text-graphite-400">{c.tiempoMinutos} min exposición</span>
                </td>

                <td className="p-3 font-medium text-gray-700 dark:text-graphite-300 max-w-xs truncate" title={c.contenido}>
                  {c.contenido}
                </td>

                <td className="p-3">
                  <span className="font-semibold text-gray-800 dark:text-graphite-100">{c.indicadorQuimico}</span>
                  <span className="block text-[10px] text-gray-500 dark:text-graphite-400">{c.indicadorBiologico}</span>
                </td>

                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${
                    esConforme ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                  }`}>
                    {esConforme ? 'CONFORME' : 'RECHAZADO'}
                  </span>
                </td>

                <td className="p-3 text-right print:hidden space-x-1">
                  <button
                    onClick={() => onSeleccionarImprimir(c)}
                    className="p-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800"
                    title="Imprimir Tique de Trazabilidad"
                  >
                    <span className="inline-flex items-center gap-1"><Tag size={10} />Tique</span>
                  </button>
                  <button
                    onClick={() => onEliminar(c.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 font-semibold rounded-lg hover:bg-red-50"
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