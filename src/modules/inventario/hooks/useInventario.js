import { useState, useMemo, useCallback } from 'react'
import { ITEMS_INVENTARIO_DEFAULT } from '../constants/inventarioConstants'
import { inventarioStorageService } from '../services/inventarioStorageService'
import { calcularResumenInventario } from '../utils/inventarioCalculations'

export const useInventario = () => {
  const [items, setItems] = useState(() => inventarioStorageService.obtenerItems(ITEMS_INVENTARIO_DEFAULT))
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')

  const resumen = useMemo(() => calcularResumenInventario(items), [items])

  const itemsFiltrados = useMemo(() => {
    return items.filter(item => {
      const coincideCat = categoriaFiltro === 'Todas' || item.categoria === categoriaFiltro
      const coincideBusqueda = !busqueda.trim() ||
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.proveedor && item.proveedor.toLowerCase().includes(busqueda.toLowerCase()))
      return coincideCat && coincideBusqueda
    })
  }, [items, busqueda, categoriaFiltro])

  const agregarOActualizarItem = useCallback((itemData) => {
    setItems(prev => {
      let actualizados = []
      const existe = prev.some(i => i.id === itemData.id)

      if (existe) {
        actualizados = prev.map(i => i.id === itemData.id ? itemData : i)
      } else {
        actualizados = [{ ...itemData, id: Date.now() }, ...prev]
      }

      inventarioStorageService.guardarItems(actualizados)
      return actualizados
    })
  }, [])

  const ajustarCantidadStock = useCallback((idItem, cambio) => {
    setItems(prev => {
      const actualizados = prev.map(i => {
        if (i.id === idItem) {
          const nuevaCant = Math.max(0, (parseInt(i.cantidad) || 0) + cambio)
          return { ...i, cantidad: nuevaCant }
        }
        return i
      })
      inventarioStorageService.guardarItems(actualizados)
      return actualizados
    })
  }, [])

  const eliminarItem = useCallback((idItem) => {
    if (window.confirm('¿Estás seguro de eliminar este insumo del inventario?')) {
      setItems(prev => {
        const actualizados = prev.filter(i => i.id !== idItem)
        inventarioStorageService.guardarItems(actualizados)
        return actualizados
      })
    }
  }, [])

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