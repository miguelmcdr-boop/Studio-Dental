/**
 * useDescuentoInventario — Hook de lógica de descuento de inventario
 * Extraído de usePresupuesto.js para cumplir límites arquitectónicos (F7-25)
 * F2-12: descuento de inventario con modal de selección
 */
import { useState } from 'react'
import {
  descontarMaterialesSeleccionados,
  detectarCategoriaTratamiento,
  PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT
} from '../../../../domains/operations/inventory/utils/inventarioCalculations'
import { inventarioStorageService } from '../../../../domains/operations/inventory/services/inventarioStorageService'
import { evolucionesStorageService, type EvolucionClinicaLocal } from '../services/evolucionesStorageService'
import { createLogger } from '../../../../services/logger'
import type { ItemPresupuesto } from './usePresupuestoItems'

const log = createLogger('useDescuentoInventario')
const STORAGE_KEY_PALABRAS_CLAVE = 'studio_dental_inventario_palabras_clave'

export interface MaterialEnriquecido {
  itemId: string | number
  nombreInsumo: string
  cantidad: number | string
  unidad: string
  stockActual: number
}

interface ItemInventarioRef {
  id: string | number
  nombre?: string
  unidad?: string
  cantidad?: number | string
  [key: string]: unknown
}

interface AsociacionMaterialRef {
  itemId?: string | number
  nombreInsumo?: string
  cantidad?: number | string
  unidad?: string
  [key: string]: unknown
}

export interface UseDescuentoInventarioOptions {
  paciente: { id: string | number; [key: string]: unknown }
  userProfile?: { nombreCompleto?: string; [key: string]: unknown } | null
  itemsPresupuesto?: ItemPresupuesto[]
  setItemsPresupuesto?: (items: ItemPresupuesto[]) => void
  evolucionesNotas?: EvolucionClinicaLocal[]
  setEvolucionesNotas?: (notas: EvolucionClinicaLocal[]) => void
}

export interface UseDescuentoInventarioReturn {
  itemPendienteDescuento: ItemPresupuesto | null
  categoriaDetectada: string
  materialesDisponibles: MaterialEnriquecido[]
  handleCambiarEstadoItem: (id: string | number, nuevoEstado: string) => void
  handleConfirmarDescuento: (materialesSeleccionados: unknown[]) => void
  handleCancelarDescuento: () => void
}

export const useDescuentoInventario = ({
  paciente,
  userProfile,
  itemsPresupuesto = [],
  setItemsPresupuesto = () => {},
  evolucionesNotas = [],
  setEvolucionesNotas = () => {}
}: UseDescuentoInventarioOptions): UseDescuentoInventarioReturn => {
  const [itemPendienteDescuento, setItemPendienteDescuento] = useState<ItemPresupuesto | null>(null)
  const [categoriaDetectada, setCategoriaDetectada] = useState<string>('')
  const [materialesDisponibles, setMaterialesDisponibles] = useState<MaterialEnriquecido[]>([])

  // F2-12: Cambiar estado de item con cohesión clínica y descuento de inventario
  const handleCambiarEstadoItem = (id: string | number, nuevoEstado: string): void => {
    let itemRealizado: ItemPresupuesto | null = null

    const actualizados = itemsPresupuesto.map(item => {
      if (String(item.id) === String(id)) {
        if (nuevoEstado === 'Realizado' && item.estado !== 'Realizado') {
          itemRealizado = item
        }
        return { ...item, estado: nuevoEstado }
      }
      return item
    })

    setItemsPresupuesto(actualizados)

    if (itemRealizado) {
      const itemFinal: ItemPresupuesto = itemRealizado
      // 1. Cohesión con Bitácora de Evoluciones
      if (setEvolucionesNotas) {
        const fechaHora = new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        const profesional = userProfile?.nombreCompleto || 'Cirujano Dentista'
        
        const nuevaNotaEvolucion: EvolucionClinicaLocal = {
          id: Date.now(),
          fecha: fechaHora,
          texto: `TRATAMIENTO REALIZADO: ${itemFinal.prestacion} (Pieza: ${itemFinal.pieza}) — Ejecutado por: ${profesional}`,
          tipo: 'evolucion'
        }

        const notasActualizadas = [nuevaNotaEvolucion, ...evolucionesNotas]
        setEvolucionesNotas(notasActualizadas)
        evolucionesStorageService.guardarEvoluciones(String(paciente.id), notasActualizadas).catch(err => log.warn("Error al guardar:", err))
      }

      // 2. F2-12: Abrir modal de selección de materiales
      try {
        const asociaciones = inventarioStorageService.obtenerAsociacionesInsumos() as Record<string, AsociacionMaterialRef[]>
        
        let palabrasClave = PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT
        try {
          const palabrasGuardadas = localStorage.getItem(STORAGE_KEY_PALABRAS_CLAVE)
          if (palabrasGuardadas) {
            palabrasClave = JSON.parse(palabrasGuardadas)
          }
        } catch {
          // Usar default si hay error
        }
        
        const categoria = String(detectarCategoriaTratamiento(itemFinal.prestacion, asociaciones, palabrasClave) || '')
        const materialesCategoria: AsociacionMaterialRef[] = asociaciones[categoria] || []
        const inventarioActual = (inventarioStorageService.obtenerItems([]) || []) as ItemInventarioRef[]
        
        const materialesEnriquecidos: MaterialEnriquecido[] = materialesCategoria
          .filter(m => m.itemId)
          .map(m => {
            const itemInventario = inventarioActual.find(i => String(i.id) === String(m.itemId))
            return {
              itemId: m.itemId!,
              nombreInsumo: String(itemInventario?.nombre || m.nombreInsumo || ''),
              cantidad: m.cantidad ?? 1,
              unidad: String(itemInventario?.unidad || m.unidad || 'Unidad'),
              stockActual: parseFloat(String(itemInventario?.cantidad ?? 0)) || 0
            }
          })
        
        setItemPendienteDescuento(itemFinal)
        setCategoriaDetectada(categoria)
        setMaterialesDisponibles(materialesEnriquecidos)
      } catch (e: unknown) {
        log.error('Error al preparar modal de descuento:', e)
      }
    }
  }

  // F2-12: Confirmar descuento desde el modal
  const handleConfirmarDescuento = (materialesSeleccionados: unknown[]): void => {
    try {
      const inventarioGuardado = inventarioStorageService.obtenerItems([])
      if (Array.isArray(inventarioGuardado) && inventarioGuardado.length > 0 && materialesSeleccionados.length > 0) {
        const inventarioActualizado = descontarMaterialesSeleccionados(inventarioGuardado, materialesSeleccionados)
        inventarioStorageService.guardarItems(inventarioActualizado)
        window.dispatchEvent(new CustomEvent('inventario_actualizado'))
      }
    } catch (e: unknown) {
      log.error('Error al descontar inventario:', e)
    } finally {
      setItemPendienteDescuento(null)
      setCategoriaDetectada('')
      setMaterialesDisponibles([])
    }
  }

  // F2-12: Cancelar descuento desde el modal
  const handleCancelarDescuento = (): void => {
    setItemPendienteDescuento(null)
    setCategoriaDetectada('')
    setMaterialesDisponibles([])
  }

  return {
    itemPendienteDescuento,
    categoriaDetectada,
    materialesDisponibles,
    handleCambiarEstadoItem,
    handleConfirmarDescuento,
    handleCancelarDescuento
  }
}
