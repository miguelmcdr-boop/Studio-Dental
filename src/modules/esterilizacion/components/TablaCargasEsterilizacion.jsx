import React, { memo } from 'react'

export const TablaCargasEsterilizacion = memo(({ cargas, onSeleccionarImprimir, onEliminar }) => {
  if (cargas.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl">
        No se encontraron registros de autoclave para los filtros seleccionados.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
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
        <tbody className="divide-y divide-gray-100">
          {cargas.map((c) => {
            const esConforme = c.estado === 'Conforme'

            return (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-black text-gray-900">
                  <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-300 font-mono text-[11px]">{c.lote}</span>
                  <span className="block text-[10px] text-gray-500 font-normal mt-0.5">Resp: {c.responsable}</span>
                </td>

                <td className="p-3 font-semibold text-gray-700">
                  {c.fecha} <span className="text-gray-400 font-normal block">{c.hora} hrs</span>
                </td>

                <td className="p-3 font-bold text-gray-800">{c.equipo}</td>

                <td className="p-3">
                  <span className="font-bold text-blue-900 block">{c.temperatura}°C / {c.presion} Bar</span>
                  <span className="text-[10px] text-gray-500">{c.tiempoMinutos} min exposición</span>
                </td>

                <td className="p-3 font-medium text-gray-700 max-w-xs truncate" title={c.contenido}>
                  {c.contenido}
                </td>

                <td className="p-3">
                  <span className="font-semibold text-gray-800">{c.indicadorQuimico}</span>
                  <span className="block text-[10px] text-gray-500">{c.indicadorBiologico}</span>
                </td>

                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${
                    esConforme ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                  }`}>
                    {esConforme ? '🟢 CONFORME' : '🔴 RECHAZADO'}
                  </span>
                </td>

                <td className="p-3 text-right print:hidden space-x-1">
                  <button
                    onClick={() => onSeleccionarImprimir(c)}
                    className="p-1.5 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-gray-800"
                    title="Imprimir Tique de Trazabilidad"
                  >
                    🏷️ Tique
                  </button>
                  <button
                    onClick={() => onEliminar(c.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 font-semibold rounded-lg hover:bg-red-50"
                    title="Eliminar ciclo"
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

TablaCargasEsterilizacion.displayName = 'TablaCargasEsterilizacion'