import React from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

export function TablaAsociaciones({
  items,
  categoriaActiva,
  asociacionesCategoriaActiva,
  handleAgregarAsociacion,
  handleActualizarAsociacion,
  handleEliminarAsociacion
}) {
  if (asociacionesCategoriaActiva.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-graphite-800 rounded-xl border border-dashed border-gray-300 dark:border-graphite-600">
        <p className="text-graphite-500 dark:text-graphite-400 text-xs">
          No hay materiales asociados a esta categoría de tratamiento.
        </p>
        <Button
          onClick={handleAgregarAsociacion}
          variant="primary"
          size="sm"
          className="mt-3"
        >
          + Agregar Primer Material
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {asociacionesCategoriaActiva.map((asociacion, index) => {
        const sinVinculacion = !asociacion.itemId
        const itemVinculado = items.find(i => i.id === asociacion.itemId)
        
        return (
          <div
            key={index}
            className={`p-4 border rounded-xl space-y-3 ${
              sinVinculacion 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' 
                : 'bg-gray-50 dark:bg-graphite-800 border-gray-200 dark:border-graphite-700'
            }`}
          >
            {sinVinculacion && (
              <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-2 text-xs text-amber-900 dark:text-amber-200">
                ⚠️ <strong>Asociación sin vinculación:</strong> Esta asociación fue migrada desde una versión anterior 
                y necesita ser vinculada a un item real del inventario. Selecciona el item correcto abajo.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-graphite-700 dark:text-graphite-300 mb-1">
                  Material del Inventario
                </label>
                <select
                  value={asociacion.itemId || ''}
                  onChange={(e) => handleActualizarAsociacion(index, 'itemId', e.target.value ? Number(e.target.value) : null)}
                  className="w-full p-2 border rounded-xl bg-white dark:bg-graphite-900 text-xs font-semibold dark:text-graphite-100 dark:border-graphite-600"
                >
                  <option value="">-- Seleccionar item del inventario --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} (Stock: {item.cantidad} {item.unidad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-graphite-700 dark:text-graphite-300 mb-1">
                  Cantidad por Tratamiento
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={asociacion.cantidad}
                  onChange={(e) => handleActualizarAsociacion(index, 'cantidad', parseFloat(e.target.value) || 0)}
                  placeholder="0.04"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-graphite-700 dark:text-graphite-300 mb-1">
                  Unidad
                </label>
                <input
                  type="text"
                  value={itemVinculado?.unidad || asociacion.unidad || ''}
                  readOnly
                  className="w-full p-2 border rounded-xl bg-gray-100 dark:bg-graphite-700 text-xs font-semibold text-graphite-600 dark:text-graphite-400"
                  placeholder="Unidad"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <Button
                  onClick={() => handleEliminarAsociacion(index)}
                  variant="danger"
                  size="sm"
                  title="Eliminar esta asociación"
                  className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  🗑️
                </Button>
              </div>
            </div>

            {itemVinculado && (
              <div className="text-[10px] text-graphite-600 dark:text-graphite-400 bg-white dark:bg-graphite-900 p-2 rounded-lg border dark:border-graphite-700">
                <strong>Stock actual:</strong> {itemVinculado.cantidad} {itemVinculado.unidad} | 
                <strong> Categoría:</strong> {itemVinculado.categoria} | 
                <strong> Proveedor:</strong> {itemVinculado.proveedor || 'N/I'}
              </div>
            )}
          </div>
        )
      })}

      <Button
        onClick={handleAgregarAsociacion}
        variant="primary"
        fullWidth
        className="py-3"
      >
        + Agregar Otro Material a {categoriaActiva}
      </Button>
    </div>
  )
}
