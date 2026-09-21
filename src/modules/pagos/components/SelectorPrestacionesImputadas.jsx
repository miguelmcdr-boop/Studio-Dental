import React, { memo } from 'react'

/**
 * SelectorPrestacionesImputadas — Lista de checkboxes para imputar pago a prestaciones (Commit G1)
 *
 * Extraído de ModalNuevoPago.jsx para reducir su tamaño.
 * Renderiza condicionalmente solo si hay prestaciones disponibles.
 */
export const SelectorPrestacionesImputadas = memo(({ prestaciones, seleccionadas, onToggle }) => {
  if (!prestaciones || prestaciones.length === 0) return null

  return (
    <div className="bg-gray-50 dark:bg-graphite-800 p-3 rounded-xl border space-y-1.5">
      <label className="block font-bold text-gray-800 dark:text-graphite-100 uppercase text-[10px]">
        Imputar Abono a Tratamientos Específicos del Paciente:
      </label>
      <div className="space-y-1 max-h-28 overflow-y-auto">
        {prestaciones.map(p => {
          const labelItem = `${p.prestacion} (${p.pieza}) - $${(parseFloat(p.valor) || 0).toLocaleString('es-CL')}`
          const estaCheck = seleccionadas.includes(labelItem)

          return (
            <label key={p.id} className="flex items-center gap-2 p-1.5 bg-white dark:bg-graphite-800 border rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-graphite-700 transition-colors duration-150">
              <input
                type="checkbox"
                checked={estaCheck}
                onChange={() => onToggle(labelItem)}
                className="rounded"
              />
              <span className="font-semibold text-gray-800 dark:text-graphite-100">{labelItem}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
})

SelectorPrestacionesImputadas.displayName = 'SelectorPrestacionesImputadas'
