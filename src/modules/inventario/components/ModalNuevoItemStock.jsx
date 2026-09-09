import React, { memo, useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
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
      setCantidad(itemEditar.cantidad ?? '')
      setMinimoCritico(itemEditar.minimoCritico ?? '5')
      setUnidad(itemEditar.unidad || UNIDADES_MEDIDA[0])
      setFechaVencimiento(itemEditar.fechaVencimiento || '')
      setPrecioUnitario(itemEditar.precioUnitario ?? '')
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
      cantidad: parseFloat(cantidad) || 0,
      minimoCritico: parseFloat(minimoCritico) || 0,
      unidad,
      fechaVencimiento,
      precioUnitario: parseFloat(precioUnitario) || 0,
      proveedor
    }

    alGuardar(itemObj)
    alCerrar()
  }

  return (
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title={itemEditar ? 'Editar Insumo de Stock' : 'Registrar Nuevo Insumo / Compra'}
      size="lg"
    >

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Nombre del Insumo / Material"
            type="text"
            required
            placeholder="Ej: Resina Z350 A2, Lidocaína 2%, Agujas Cortas..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

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
            <Input
              label="Cantidad Inicial / Comprada"
              type="number"
              required
              step="0.01"
              min="0"
              placeholder="Ej: 10 o 0.5"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />

            <Input
              label="Stock Mínimo Crítico"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 3 o 0.1"
              value={minimoCritico}
              onChange={(e) => setMinimoCritico(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha de Vencimiento"
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
            />

            <Input
              label="Precio Unitario ($ CLP)"
              type="number"
              step="0.01"
              placeholder="Ej: 12500"
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(e.target.value)}
            />
          </div>

          <Input
            label="Proveedor / Casa Dental"
            type="text"
            placeholder="Ej: Dental Ahumada, 3M, Voco, Directo..."
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
          />

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              onClick={alCerrar}
              variant="ghost"
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              Guardar Insumo
            </Button>
          </div>
        </form>
    </Modal>
  )
})

ModalNuevoItemStock.displayName = 'ModalNuevoItemStock'