import { useState, useMemo, useCallback, useEffect } from 'react'
import type React from 'react'
import { ITEMS_INVENTARIO_DEFAULT } from '../constants/inventarioConstants'
import { inventarioStorageService, type ItemInventario } from '../services/inventarioStorageService'
import { calcularResumenInventario } from '../utils/inventarioCalculations'
import { useAppDialog } from '../../../../hooks/useAppDialog'

export type { ItemInventario }

export interface ResumenInventario {
  totalInsumos: number
  stockCriticoCount: number
  porVencerCount: number
  valorTotalInventario: number
}

export interface UseInventarioReturn {
  items: ItemInventario[]
  resumen: ResumenInventario
  busqueda: string
  setBusqueda: React.Dispatch<React.SetStateAction<string>>
  categoriaFiltro: string
  setCategoriaFiltro: React.Dispatch<React.SetStateAction<string>>
  agregarOActualizarItem: (itemData: ItemInventario | (Partial<ItemInventario> & { nombre: string; categoria: string; cantidad: number; minimoCritico: number; unidad: string })) => void
  ajustarCantidadStock: (idItem: string | number, cambio: number) => void
  eliminarItem: (idItem: string | number) => Promise<void>
}

export const useInventario = (): UseInventarioReturn => {
  const { confirm } = useAppDialog()
  const [items, setItems] = useState<ItemInventario[]>(() =>
    inventarioStorageService.obtenerItems(ITEMS_INVENTARIO_DEFAULT as unknown as ItemInventario[])
  )
  const [busqueda, setBusqueda] = useState<string>('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas')

  // F2-12b: escuchar evento de descuento desde otros módulos (PresupuestoSection)
  useEffect(() => {
    const handleInventarioActualizado = (): void => {
      const itemsActualizados = inventarioStorageService.obtenerItems(ITEMS_INVENTARIO_DEFAULT as unknown as ItemInventario[])
      setItems(itemsActualizados)
    }

    window.addEventListener('inventario_actualizado', handleInventarioActualizado)
    return () => {
      window.removeEventListener('inventario_actualizado', handleInventarioActualizado)
    }
  }, [])

  const resumen = useMemo(() => calcularResumenInventario(items) as ResumenInventario, [items])

  const itemsFiltrados = useMemo(() => {
    return items.filter(item => {
      const coincideCat = categoriaFiltro === 'Todas' || item.categoria === categoriaFiltro
      const coincideBusqueda = !busqueda.trim() ||
        (item.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (Boolean(item.proveedor) && String(item.proveedor).toLowerCase().includes(busqueda.toLowerCase()))
      return coincideCat && coincideBusqueda
    })
  }, [items, busqueda, categoriaFiltro])

  const agregarOActualizarItem = useCallback((itemData: ItemInventario | (Partial<ItemInventario> & { nombre: string; categoria: string; cantidad: number; minimoCritico: number; unidad: string })): void => {
    setItems(prev => {
      let actualizados: ItemInventario[] = []
      const existe = prev.some(i => String(i.id) === String(itemData.id))

      if (existe) {
        actualizados = prev.map(i => String(i.id) === String(itemData.id) ? (itemData as ItemInventario) : i)
      } else {
        actualizados = [{ ...(itemData as ItemInventario), id: itemData.id || Date.now() }, ...prev]
      }

      inventarioStorageService.guardarItems(actualizados)
      return actualizados
    })
  }, [])

  const ajustarCantidadStock = useCallback((idItem: string | number, cambio: number): void => {
    setItems(prev => {
      const actualizados = prev.map(i => {
        if (String(i.id) === String(idItem)) {
          // F2-12a: parseFloat para soportar stocks fraccionales
          const nuevaCant = Math.max(0, (parseFloat(String(i.cantidad)) || 0) + cambio)
          return { ...i, cantidad: nuevaCant }
        }
        return i
      })
      inventarioStorageService.guardarItems(actualizados)
      return actualizados
    })
  }, [])

  const eliminarItem = useCallback(async (idItem: string | number): Promise<void> => {
    const ok = await confirm({
      title: 'Eliminar insumo',
      description: '¿Estás seguro de eliminar este insumo del inventario?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      setItems(prev => {
        const actualizados = prev.filter(i => String(i.id) !== String(idItem))
        inventarioStorageService.guardarItems(actualizados)
        return actualizados
      })
    }
  }, [confirm])

  return {
    items: itemsFiltrados,
    resumen,
    busqueda,
    setBusqueda,
    categoriaFiltro,
    setCategoriaFiltro,
    agregarOActualizarItem,
    ajustarCantidadStock,
    eliminarItem
  }
}
