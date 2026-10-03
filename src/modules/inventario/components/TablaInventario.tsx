import React, { memo } from 'react'
import { Button } from '../../../components/ui/Button'
import { evaluarEstadoStock, evaluarVencimiento } from '../utils/inventarioCalculations'
import { Pencil, Trash2 } from 'lucide-react'
import type { ItemInventario } from '../services/inventarioStorageService'

export interface TablaInventarioProps {
  items: ItemInventario[]
  onAjustarCantidad: (idItem: string | number, cambio: number) => void
  onEditar: (item: ItemInventario) => void
  onEliminar: (idItem: string | number) => void | Promise<void>
}

export const TablaInventario: React.FC<TablaInventarioProps> = memo(({
  items,
  onAjustarCantidad,
  onEditar,
  onEliminar
}) => {
  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-gray-400 dark:text-graphite-500 bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl">
        No se encontraron insumos de acuerdo a los criterios de búsqueda.
      </div>
    )
  }

  return (
    <div className="bg-surface border border-surface rounded-2xl overflow-hidden shadow-xs text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-graphite-50 dark:bg-graphite-950 surgical:bg-graphite-200 border-b border-surface text-gray-700 dark:text-graphite-300 surgical:text-black font-bold uppercase text-[10px]">
            <th className="p-3">Insumo / Producto</th>
            <th className="p-3">Categoría</th>
            <th className="p-3 text-center">Stock Actual</th>
            <th className="p-3 text-center">Estado Stock</th>
            <th className="p-3">Vencimiento</th>
            <th className="p-3">Proveedor</th>
            <th className="p-3 text-right print:hidden">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-graphite-800">
          {items.map((item) => {
            const estadoStock = evaluarEstadoStock(item)
            const estadoVenc = evaluarVencimiento(item.fechaVencimiento)

            return (
              <tr
                key={item.id}
                className="hover:bg-gray-50 dark:hover:bg-graphite-800 surgical:hover:bg-slate-200 transition-colors"
              >
                <td className="p-3 font-bold text-gray-900 dark:text-graphite-50 surgical:text-black">
                  {item.nombre}
                  <span className="block text-[10px] font-normal text-gray-500 dark:text-graphite-400 surgical:text-graphite-600 tabular-nums">
                    Mínimo deseado: {item.minimoCritico} {item.unidad}
                  </span>
                </td>

                <td className="p-3 font-medium text-gray-600 dark:text-graphite-400 surgical:text-graphite-700">
                  {item.categoria}
                </td>

                <td className="p-3 text-center font-bold">
                  <div className="inline-flex items-center gap-1.5 bg-graphite-50 dark:bg-graphite-950 surgical:bg-white px-2 py-1 rounded-xl border border-surface">
                    <Button
                      onClick={() => onAjustarCantidad(item.id, -1)}
                      size="sm"
                      variant="secondary"
                      className="w-5 h-5 p-0 font-black text-xs"
                      title="Disminuir stock"
                    >
                      -
                    </Button>
                    <span className="text-sm px-1 text-gray-900 dark:text-graphite-50 surgical:text-black tabular-nums">
                      {item.cantidad}
                    </span>
                    <Button
                      onClick={() => onAjustarCantidad(item.id, 1)}
                      size="sm"
                      variant="secondary"
                      className="w-5 h-5 p-0 font-black text-xs"
                      title="Aumentar stock"
                    >
                      +
                    </Button>
                  </div>
                </td>

                <td className="p-3 text-center">
                  <span
                    className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${estadoStock.colorBg} ${estadoStock.colorText}`}
                  >
                    {estadoStock.texto}
                  </span>
                </td>

                <td className="p-3 tabular-nums">
                  <span
                    className={`font-semibold ${
                      estadoVenc.estado === 'vencido'
                        ? 'text-red-600 dark:text-red-400 font-bold'
                        : estadoVenc.estado === 'por_vencer'
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-gray-600 dark:text-graphite-400 surgical:text-graphite-700'
                    }`}
                  >
                    {item.fechaVencimiento || 'N/I'}
                  </span>
                  {estadoVenc.estado !== 'ok' && (
                    <span className="block text-[9px] font-bold text-red-500">
                      {estadoVenc.texto}
                    </span>
                  )}
                </td>

                <td className="p-3 text-gray-600 dark:text-graphite-400">
                  {item.proveedor || 'N/I'}
                </td>

                <td className="p-3 text-right print:hidden space-x-1">
                  <Button
                    onClick={() => onEditar(item)}
                    size="sm"
                    variant="ghost"
                    className="p-1.5"
                    title="Editar insumo"
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    onClick={() => void onEliminar(item.id)}
                    size="sm"
                    variant="danger"
                    className="p-1.5"
                    title="Eliminar insumo"
                  >
                    <Trash2 size={12} />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

TablaInventario.displayName = 'TablaInventario'
