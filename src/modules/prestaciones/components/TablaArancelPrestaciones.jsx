import React, { memo } from 'react'

export const TablaArancelPrestaciones = memo(({ prestaciones, onEditar, onEliminar }) => {
  if (prestaciones.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl">
        No se encontraron procedimientos en el arancel para los filtros seleccionados.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
            <th className="p-3">Código Fonasa</th>
            <th className="p-3">Nombre del Procedimiento / Prestación</th>
            <th className="p-3">Especialidad Clínica</th>
            <th className="p-3 text-right">Precio Particular ($)</th>
            <th className="p-3 text-right">Precio Fonasa / Convenio ($)</th>
            <th className="p-3 text-right print:hidden">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {prestaciones.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="p-3 font-mono font-bold text-gray-500">
                {p.codigoFonasa ? (
                  <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-300">{p.codigoFonasa}</span>
                ) : (
                  <span className="text-gray-300">N/A</span>
                )}
              </td>

              <td className="p-3 font-extrabold text-gray-900">{p.nombre}</td>

              <td className="p-3 font-semibold text-purple-900">
                <span className="bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                  {p.especialidad || 'General'}
                </span>
              </td>

              <td className="p-3 text-right font-black text-emerald-900 text-sm">
                ${(parseFloat(p.precioParticular) || 0).toLocaleString('es-CL')} CLP
              </td>

              <td className="p-3 text-right font-bold text-blue-900">
                ${(parseFloat(p.precioFonasa) || 0).toLocaleString('es-CL')} CLP
              </td>

              <td className="p-3 text-right print:hidden space-x-1">
                <button
                  onClick={() => onEditar(p)}
                  className="p-1.5 text-gray-600 hover:text-black font-semibold rounded-lg hover:bg-gray-100"
                  title="Editar prestación"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onEliminar(p.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 font-semibold rounded-lg hover:bg-red-50"
                  title="Eliminar prestación"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

TablaArancelPrestaciones.displayName = 'TablaArancelPrestaciones'