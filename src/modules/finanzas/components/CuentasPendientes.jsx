import React, { memo } from 'react'

export const CuentasPendientes = memo(({ pacientes = [] }) => {
  return (
    <div className="space-y-6 text-xs">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            📊 Resumen de Saldos Pendientes de Cobro (Pacientes en Mora)
          </h3>
          <p className="text-gray-500 text-[11px]">
            Pacientes con tratamientos iniciados que mantienen copagos o abonos pendientes.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {pacientes.map(p => (
            <div key={p.id} className="py-3 flex justify-between items-center flex-wrap gap-2 hover:bg-gray-50 p-2 rounded-xl">
              <div>
                <span className="font-bold text-gray-900 block">{p.nombre} ({p.rut})</span>
                <span className="text-[10px] text-gray-500">Tel: {p.telefono || 'Sin teléfono'} | Previsión: {p.prevision}</span>
              </div>

              <div className="text-right">
                <span className="font-semibold text-gray-600 block text-[10px]">Previsión: {p.prevision}</span>
                <span className="font-extrabold text-blue-900 text-xs">Ficha Activa</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

CuentasPendientes.displayName = 'CuentasPendientes'