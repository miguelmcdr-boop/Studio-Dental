import React, { memo, useState, useEffect } from 'react'
import { CATEGORIAS_INSUMOS, UNIDADES_MEDIDA } from '../constants/inventarioConstants'

export const ModalNuevoItemStock = memo(({ itemEditar, alGuardar, alCerrar }) => {
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_INSUMOS[0])
  const [cantidad, setCantidad] = useState('')
  const [minimoCritico, setMinimoCritico] = useState('5')
  const [unidad, setUnidad] = useState(UNIDADES_MEDIDA[0])
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [proveedor, setProveedor] = useState('')

  useEffect(() => {
    if (itemEditar) {
      setNombre(itemEditar.nombre || '')
      setCategoria(itemEditar.categoria || CATEGORIAS_INSUMOS[0])
      setCantidad(itemEditar.cantidad || '')
      setMinimoCritico(itemEditar.minimoCritico || '5')
      setUnidad(itemEditar.unidad || UNIDADES_MEDIDA[0])
      setFechaVencimiento(itemEditar.fechaVencimiento || '')
      setPrecioUnitario(itemEditar.precioUnitario || '')
      setProveedor(itemEditar.proveedor || '')
    }
  }, [itemEditar])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return

    const itemObj = {
      id: itemEditar ? itemEditar.id : Date.now(),
      nombre,
      categoria,
      cantidad: parseInt(cantidad) || 0,
      minimoCritico: parseInt(minimoCritico) || 0,
      unidad,
      fechaVencimiento,
      precioUnitario: parseFloat(precioUnitario) || 0,
      proveedor
    }

    alGuardar(itemObj)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">
            {itemEditar ? 'Editar Insumo de Stock' : 'Registrar Nuevo Insumo / Compra'}
          </h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nombre del Insumo / Material *</label>
            <input
              type="text"
              required
              placeholder="Ej: Resina Z350 A2, Lidocaína 2%, Agujas Cortas..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
              >
                {CATEGORIAS_INSUMOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Unidad de Medida</label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
              >
                {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Cantidad Inicial / Comprada</label>
              <input
                type="number"
                required
                placeholder="Ej: 10"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Stock Mínimo Crítico</label>
              <input
                type="number"
                placeholder="Ej: 3"
                value={minimoCritico}
                onChange={(e) => setMinimoCritico(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Fecha de Vencimiento</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Precio Unitario ($ CLP)</label>
              <input
                type="number"
                placeholder="Ej: 12500"
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Proveedor / Casa Dental</label>
            <input
              type="text"
              placeholder="Ej: Dental Ahumada, 3M, Voco, Directo..."
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={alCerrar}
              className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-black text-white py-2.5 rounded-xl font-bold hover:bg-gray-800"
            >
              Guardar Insumo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevoItemStock.displayName = 'ModalNuevoItemStock'