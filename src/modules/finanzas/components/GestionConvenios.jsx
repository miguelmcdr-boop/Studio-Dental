import React, { memo } from 'react'

export const GestionConvenios = memo(({ convenios, onActualizarDescuento }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          🏷️ Tarifarios y Motor de Convenios Automáticos
        </h3>
        <p className="text-gray-500 text-[11px]">Configura el porcentaje de descuento automático según la previsión o convenio del paciente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {convenios.map(conv => (
          <div key={conv.id} className="p-4 border rounded-xl bg-gray-50 flex justify-between items-center">
            <div>
              <span className="font-bold text-xs text-gray-800 block">{conv.nombre}</span>
              <span className="text-[10px] text-gray-400">Descuento aplicado al presupuesto</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={conv.descuentoDefecto}
                onChange={(e) => onActualizarDescuento(conv.id, e.target.value)}
                className="w-14 px-2 py-1 border rounded-lg font-bold text-center text-xs bg-white text-emerald-800"
              />
              <span className="font-bold text-xs text-gray-600">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

GestionConvenios.displayName = 'GestionConvenios'