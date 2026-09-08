/**
 * FormularioAgregarPrestacion — Formulario para agregar prestaciones al presupuesto
 * Extraído de PresupuestoSection.jsx para cumplir límites arquitectónicos (F7-25)
 * F2-07a: sincronización con arancel global
 */
import React, { memo } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

export const FormularioAgregarPrestacion = memo(({
  arancelActualizado,
  convenioAplicado,
  piezaPresupuesto,
  prestacionSeleccionadaId,
  nombrePrestacion,
  valorPrestacion,
  precioBaseOriginal,
  porcentajeDescuentoAplicado,
  handleSeleccionarPrestacion,
  handleCambiarConvenioSelect,
  handleAgregarItemPresupuesto,
  setPiezaPresupuesto,
  setNombrePrestacion,
  setValorPrestacion
}) => {
  return (
    <div className="bg-gray-50 dark:bg-graphite-800 p-4 border border-gray-200 dark:border-graphite-700 rounded-2xl mb-6 print:hidden space-y-4">
      <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
        <h4 className="font-bold text-xs text-graphite-800 dark:text-graphite-100 uppercase tracking-wider">
          Añadir Prestación al Plan de Tratamiento
        </h4>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-graphite-600 dark:text-graphite-400">Convenio Activo:</span>
          <select
            value={convenioAplicado}
            onChange={(e) => handleCambiarConvenioSelect(e.target.value)}
            className="px-2.5 py-1 border rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 font-bold border-emerald-300 dark:border-emerald-700"
          >
            <option value="Particular">Particular (Sin Descuento)</option>
            <option value="Fonasa">Fonasa (-15%)</option>
            <option value="Isapre">Isapre (-20%)</option>
            <option value="Empresa">Convenio Institucional (-25%)</option>
          </select>
        </div>
      </div>
      
      <form onSubmit={handleAgregarItemPresupuesto} className="flex flex-wrap gap-3 items-end text-xs">
        <Input
          label="Pieza Dental"
          type="text"
          placeholder="Ej: 1.6 o General"
          value={piezaPresupuesto}
          onChange={(e) => setPiezaPresupuesto(e.target.value)}
          className="w-28"
        />

        <div className="flex-1 min-w-[200px]">
          <label className="block text-graphite-600 dark:text-graphite-400 mb-1 font-semibold">
            Catálogo & Packs ({arancelActualizado.length})
          </label>
          <select
            value={prestacionSeleccionadaId}
            onChange={(e) => handleSeleccionarPrestacion(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-graphite-900 font-semibold text-xs dark:text-graphite-100 dark:border-graphite-600"
          >
            <option value="">-- Buscar en catálogo de prestaciones o packs --</option>
            {arancelActualizado.map(p => {
              const precioMostrar = parseFloat(p.precio ?? p.precioParticular) || 0
              return (
                <option key={p.id} value={p.id}>
                  [{p.especialidad || 'General'}] {p.nombre} — Base: ${precioMostrar.toLocaleString('es-CL')} CLP
                </option>
              )
            })}
          </select>
        </div>

        <Input
          label="Nombre Prestación (O libre)"
          type="text"
          placeholder="Nombre de la prestación"
          value={nombrePrestacion}
          onChange={(e) => setNombrePrestacion(e.target.value)}
          className="flex-1 min-w-[180px]"
        />

        <Input
          label={<>Valor Final ($ CLP) {porcentajeDescuentoAplicado > 0 && <span className="text-emerald-600 font-bold">(-{porcentajeDescuentoAplicado}%)</span>}</>}
          type="number"
          placeholder="Monto"
          value={valorPrestacion}
          onChange={(e) => setValorPrestacion(e.target.value)}
          className="w-32"
        />

        <Button type="submit" variant="primary" size="sm">
          + Agregar al Presupuesto
        </Button>
      </form>

      {precioBaseOriginal > 0 && porcentajeDescuentoAplicado > 0 && (
        <div className="text-[11px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
          <span>🏷️ Descuento aplicado por Convenio (<strong>{convenioAplicado}</strong>): -{porcentajeDescuentoAplicado}%</span>
          <span>Precio Base: <del>${precioBaseOriginal.toLocaleString('es-CL')}</del> → Precio Final: <strong>${parseInt(valorPrestacion).toLocaleString('es-CL')} CLP</strong></span>
        </div>
      )}
    </div>
  )
})

FormularioAgregarPrestacion.displayName = 'FormularioAgregarPrestacion'
