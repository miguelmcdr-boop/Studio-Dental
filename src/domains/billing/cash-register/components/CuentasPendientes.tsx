import React, { memo } from 'react'
import { BarChart3 } from 'lucide-react'
import type { Paciente } from '../../../../modules/pacientes/schemas/pacienteSchema'

export interface CuentasPendientesProps {
  pacientes?: Paciente[]
}

export const CuentasPendientes = memo<CuentasPendientesProps>(({ pacientes = [] }) => {
  return (
    <div className="space-y-6 text-xs">
      <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 uppercase tracking-wider">
            <span className="inline-flex items-center gap-1"><BarChart3 size={14} />Resumen de Saldos Pendientes de Cobro (Pacientes en Mora)</span>
          </h3>
          <p className="text-gray-500 dark:text-graphite-400 text-[11px]">
            Pacientes con tratamientos iniciados que mantienen copagos o abonos pendientes.
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-graphite-800">
          {pacientes.map(p => {
            const previsionStr = typeof p.prevision === 'string' ? p.prevision : 'Particular'
            const telefonoStr = p.telefono != null ? String(p.telefono) : 'Sin teléfono'

            return (
              <div key={p.id} className="py-3 flex justify-between items-center flex-wrap gap-2 hover:bg-gray-50 dark:hover:bg-graphite-700 p-2 rounded-xl transition-colors duration-150">
                <div>
                  <span className="font-bold text-gray-900 dark:text-graphite-50 block">{p.nombre} ({p.rut})</span>
                  <span className="text-[10px] text-gray-500 dark:text-graphite-400">Tel: {telefonoStr} | Previsión: {previsionStr}</span>
                </div>

                <div className="text-right">
                  <span className="font-semibold text-gray-600 dark:text-graphite-400 block text-[10px]">Previsión: {previsionStr}</span>
                  <span className="font-extrabold text-blue-900 text-xs">Ficha Activa</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

CuentasPendientes.displayName = 'CuentasPendientes'
