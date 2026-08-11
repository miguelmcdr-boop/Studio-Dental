import React, { memo, useState } from 'react'
import { CATEGORIAS_INSUMOS } from './constants/inventarioConstants'
import { useInventario } from './hooks/useInventario'
import { StockSummaryCards } from './components/StockSummaryCards'
import { TablaInventario } from './components/TablaInventario'
import { ModalNuevoItemStock } from './components/ModalNuevoItemStock'
import { AsociacionesInsumos } from './components/AsociacionesInsumos'

export const InventarioModulo = memo(() => {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditar, setItemEditar] = useState(null)
  const [mostrarAsociaciones, setMostrarAsociaciones] = useState(false)

  const {
    items,
    resumen,
    busqueda,
    setBusqueda,
    categoriaFiltro,
    setCategoriaFiltro,
    agregarOActualizarItem,
    ajustarCantidadStock,
    eliminarItem
  } = useInventario()

  const handleAbrirNuevo = () => {
    setItemEditar(null)
    setModalAbierto(true)
  }

  const handleAbrirEditar = (item) => {
    setItemEditar(item)
    setModalAbierto(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">📦 Control de Inventario e Insumos Clínicos</h2>
          <p className="text-xs text-gray-500">Monitoreo de existencias, fechas de caducidad y reabastecimiento.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMostrarAsociaciones(!mostrarAsociaciones)}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer ${
              mostrarAsociaciones
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⚙️ {mostrarAsociaciones ? 'Ocultar' : 'Configurar'} Asociaciones Tratamiento-Material
          </button>

          <button
            onClick={handleAbrirNuevo}
            className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            + Agregar Nuevo Insumo
          </button>
        </div>
      </div>

      <StockSummaryCards resumen={resumen} />

      <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-gray-600">Categoría:</span>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="p-2 border rounded-xl bg-white font-semibold flex-1 sm:flex-initial"
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORIAS_INSUMOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar insumo o proveedor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="p-2 border rounded-xl bg-white w-full sm:w-64"
        />
      </div>

      <TablaInventario
        items={items}
        onAjustarCantidad={ajustarCantidadStock}
        onEditar={handleAbrirEditar}
        onEliminar={eliminarItem}
      />

      {/* F2-12: Sección de Asociaciones Tratamiento-Material */}
      {mostrarAsociaciones && (
        <AsociacionesInsumos items={items} />
      )}

      {modalAbierto && (
        <ModalNuevoItemStock
          itemEditar={itemEditar}
          alGuardar={agregarOActualizarItem}
          alCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
})

InventarioModulo.displayName = 'InventarioModulo'