import React, { memo, useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'

export const ModalDescuentoInventario = memo(({
  item,
  categoria,
  materialesDisponibles,
  alConfirmar,
  alCancelar
}) => {
  // Estado local: cada material con checkbox de selección y cantidad editable
  const [seleccion, setSeleccion] = useState(() => 
    materialesDisponibles.map(m => ({
      itemId: m.itemId,
      nombreInsumo: m.nombreInsumo,
      unidad: m.unidad,
      stockActual: m.stockActual,
      seleccionado: true,
      cantidad: m.cantidad
    }))
  )

  const handleToggleSeleccion = (index) => {
    setSeleccion(prev => prev.map((s, i) => 
      i === index ? { ...s, seleccionado: !s.seleccionado } : s
    ))
  }

  const handleCambiarCantidad = (index, nuevaCantidad) => {
    const cantidadValida = Math.max(0, parseFloat(nuevaCantidad) || 0)
    setSeleccion(prev => prev.map((s, i) => 
      i === index ? { ...s, cantidad: cantidadValida } : s
    ))
  }

  const materialesSeleccionados = seleccion.filter(s => s.seleccionado)
  const hayMaterialesSeleccionados = materialesSeleccionados.length > 0

  return (
    <Modal isOpen={true} onClose={alCancelar} title="Marcar Tratamiento como Realizado" size="xl">
      <div className="space-y-1 mb-4 text-xs">
        <p className="text-gray-700">
          <strong>Tratamiento:</strong> {item.prestacion}
        </p>
        <p className="text-gray-700">
          <strong>Pieza:</strong> {item.pieza}
        </p>
        <p className="text-gray-700">
          <strong>Categoría detectada:</strong> {categoria}
        </p>
      </div>

        {materialesDisponibles.length === 0 ? (
          <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-amber-900 font-semibold">
              ⚠️ No hay materiales configurados para la categoría "{categoria}".
            </p>
            <p className="text-amber-700 mt-2">
              Puedes configurar las asociaciones en el módulo Inventario → "Configurar Asociaciones Tratamiento-Material".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="font-bold text-gray-800 text-xs uppercase block">
              📦 Selecciona los materiales utilizados en esta sesión:
            </span>

            {seleccion.map((material, index) => {
              const stockDespues = Math.max(0, material.stockActual - material.cantidad)
              const descuentoExcedeStock = material.cantidad > material.stockActual

              return (
                <div
                  key={index}
                  className={`p-3 border rounded-xl transition-all ${
                    material.seleccionado 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={material.seleccionado}
                      onChange={() => handleToggleSeleccion(index)}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-gray-900 block">{material.nombreInsumo}</span>
                      <span className="text-gray-600 text-[10px]">
                        Stock actual: {material.stockActual} {material.unidad} → Después: {stockDespues} {material.unidad}
                      </span>
                      
                      {descuentoExcedeStock && material.seleccionado && (
                        <span className="block text-red-600 font-bold text-[10px] mt-1">
                          ⚠️ La cantidad excede el stock disponible. Se descontará hasta 0.
                        </span>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-600 font-semibold">Cantidad:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={material.cantidad}
                          onChange={(e) => handleCambiarCantidad(index, e.target.value)}
                          disabled={!material.seleccionado}
                          className={`p-1.5 border rounded-lg w-24 font-bold ${
                            material.seleccionado 
                              ? 'bg-white border-gray-300' 
                              : 'bg-gray-100 border-gray-200 text-gray-400'
                          }`}
                        />
                        <span className="text-gray-500">{material.unidad}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="bg-gray-100 p-3 rounded-xl border">
              <span className="font-bold text-gray-800 text-xs">
                Resumen: {materialesSeleccionados.length} material(es) seleccionado(s)
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-3 border-t">
          <Button
            onClick={alCancelar}
            variant="ghost"
            fullWidth
          >
            Cancelar Descuento (Marcar Realizado sin descontar)
          </Button>
          <Button
            onClick={() => alConfirmar(materialesSeleccionados)}
            disabled={!hayMaterialesSeleccionados}
            variant="primary"
            fullWidth
          >
            Confirmar y Descontar ✓
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900">
          <strong>💡 Tip:</strong> "Cancelar Descuento" marca el tratamiento como Realizado pero no descuenta stock. 
          Úsalo si los materiales ya estaban descontados o si prefieres ajustar el inventario manualmente.
        </div>
    </Modal>
  )
})

ModalDescuentoInventario.displayName = 'ModalDescuentoInventario'