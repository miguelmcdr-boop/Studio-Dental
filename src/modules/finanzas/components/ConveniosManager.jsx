import React, { memo } from 'react'

export const ConveniosManager = memo(({ convenios, onActualizarDescuento }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          ⚙️ Configuración Global de Convenios & Descuentos
        </h3>
        <p className="text-gray-500 text-[11px]">
          Estos porcentajes se aplican automáticamente en el Plan de Tratamiento de la Ficha Clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {convenios.map((c) => (
          <div key={c.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 flex justify-between items-center">
            <div>
              <span className="font-extrabold text-gray-900 text-xs block">{c.nombre}</span>
              <span className="text-[10px] text-gray-500 block">{c.descripcion}</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={c.descuentoDefecto}
                onChange={(e) => onActualizarDescuento(c.id, e.target.value)}
                className="w-16 p-2 border border-gray-300 rounded-lg text-center font-black text-sm bg-white"
              />
              <span className="font-bold text-gray-700">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

ConveniosManager.displayName = 'ConveniosManager'