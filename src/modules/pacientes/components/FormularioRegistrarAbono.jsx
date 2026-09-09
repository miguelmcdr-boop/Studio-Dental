/**
 * FormularioRegistrarAbono — Formulario para registrar abonos del paciente
 * Extraído de PresupuestoSection.jsx para cumplir límites arquitectónicos (F7-25)
 */
import React, { memo } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

export const FormularioRegistrarAbono = memo(({
  abonos,
  montoAbono,
  metodoPagoAbono,
  handleAgregarAbono,
  handleEliminarAbono,
  setValorAbono,
  setMetodoPagoAbono
}) => {
  return (
    <div className="bg-white dark:bg-graphite-800 p-4 border border-gray-200 dark:border-graphite-700 rounded-2xl mb-6 print:hidden">
      <h4 className="font-bold text-xs text-graphite-800 dark:text-graphite-100 mb-3 uppercase tracking-wider">
        Registrar Abono / Pago del Paciente
      </h4>
      <form onSubmit={handleAgregarAbono} className="flex flex-wrap gap-3 items-end text-xs">
        <Input
          label="Monto ($ CLP)"
          type="number"
          placeholder="Monto ($ CLP)"
          value={montoAbono}
          onChange={(e) => setValorAbono(e.target.value)}
          className="w-36"
        />

        <div>
          <label className="block text-graphite-600 dark:text-graphite-400 mb-1 font-semibold">Método de Pago</label>
          <select
            value={metodoPagoAbono}
            onChange={(e) => setMetodoPagoAbono(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-graphite-900 font-semibold dark:text-graphite-100 dark:border-graphite-600"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia Bancaria</option>
            <option value="Débito">Tarjeta de Débito</option>
            <option value="Crédito">Tarjeta de Crédito</option>
          </select>
        </div>

        <Button type="submit" variant="primary" size="sm" className="bg-green-700 hover:bg-green-800">
          + Registrar Abono
        </Button>
      </form>

      {abonos.length > 0 && (
        <div className="mt-4 pt-3 border-t dark:border-graphite-700">
          <span className="text-[11px] font-bold text-graphite-600 dark:text-graphite-400 uppercase block mb-2">
            Historial de Abonos Registrados:
          </span>
          <div className="space-y-1.5">
            {abonos.map(a => (
              <div key={a.id} className="flex justify-between items-center bg-gray-50 dark:bg-graphite-900 px-3 py-1.5 rounded-lg border dark:border-graphite-700 text-xs">
                <span>
                  <strong className="text-graphite-800 dark:text-graphite-100">
                    ${a.monto.toLocaleString('es-CL')} CLP
                  </strong> — {a.metodoPago} ({a.fecha})
                </span>
                <Button
                  onClick={() => handleEliminarAbono(a.id)}
                  variant="danger"
                  size="sm"
                  className="ml-2 p-1"
                  aria-label="Eliminar abono"
                >
                  🗑️ Borrar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

FormularioRegistrarAbono.displayName = 'FormularioRegistrarAbono'
