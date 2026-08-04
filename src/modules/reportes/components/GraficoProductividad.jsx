import React, { memo } from 'react'
import { ESPECIALIDADES_COLOR } from '../constants/reportesConstants'

export const GraficoProductividad = memo(({ desgloseEspecialidad = {} }) => {
  const entradas = Object.entries(desgloseEspecialidad)
  const montoMaximo = Math.max(...entradas.map(([, v]) => v), 1)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs text-xs space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">📊 Distribución por Especialidad Odontológica</h3>
        <span className="text-[10px] text-gray-500 font-semibold">Proporción de Ingresos</span>
      </div>
      
      {entradas.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No hay registros de especialidades asignadas.</p>
      ) : (
        <div className="space-y-3">
          {entradas.map(([esp, monto]) => {
            const porcentaje = Math.round((monto / montoMaximo) * 100)
            const colorBarra = ESPECIALIDADES_COLOR[esp] || 'bg-black'

            return (
              <div key={esp} className="space-y-1">
                <div className="flex justify-between font-semibold text-gray-800 text-[11px]">
                  <span>{esp}</span>
                  <span className="font-extrabold text-emerald-900">${monto.toLocaleString('es-CL')} CLP</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${colorBarra} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

GraficoProductividad.displayName = 'GraficoProductividad'