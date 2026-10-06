/**
 * useDescuentoInventario — Hook de lógica de descuento de inventario
 * Extraído de usePresupuesto.js para cumplir límites arquitectónicos (F7-25)
 * F2-12: descuento de inventario con modal de selección
 *
 * Refactorizado en Fase 4B-1: utiliza el Application Service `completeTreatment`
 * para desacoplar el dominio Pacientes de los internos de Inventario.
 */
import { useState } from 'react'
import {
  prepararMaterialesParaDescuento,
  descontarMateriales,
  registrarEvolucionTratamientoRealizado,
  type MaterialEnriquecido,
} from '../../../../application/treatment'
import type { EvolucionClinicaLocal } from '../services/evolucionesStorageService'
import { createLogger } from '../../../../infrastructure/logging/logger'
import type { ItemPresupuesto } from './usePresupuestoItems'

const log = createLogger('useDescuentoInventario')

export type { MaterialEnriquecido }

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
  setEvolucionesNotas = () => {},
}: UseDescuentoInventarioOptions): UseDescuentoInventarioReturn => {
  const [itemPendienteDescuento, setItemPendienteDescuento] = useState<ItemPresupuesto | null>(null)
  const [categoriaDetectada, setCategoriaDetectada] = useState<string>('')
  const [materialesDisponibles, setMaterialesDisponibles] = useState<MaterialEnriquecido[]>([])

  // F2-12: Cambiar estado de item con cohesión clínica y descuento de inventario
  const handleCambiarEstadoItem = (id: string | number, nuevoEstado: string): void => {
    let itemRealizado: ItemPresupuesto | null = null

    const actualizados = itemsPresupuesto.map((item) => {
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
      // 1. Cohesión con Bitácora de Evoluciones vía Application Service
      if (setEvolucionesNotas) {
        const profesional = userProfile?.nombreCompleto || 'Cirujano Dentista'
        registrarEvolucionTratamientoRealizado(
          paciente.id,
          itemFinal,
          profesional,
          evolucionesNotas
        ).then((notasActualizadas) => {
          setEvolucionesNotas(notasActualizadas)
        }).catch((err) => log.warn('Error al guardar evolución:', err))
      }

      // 2. F2-12: Abrir modal de selección de materiales vía Application Service
      try {
        const { categoria, materiales } = prepararMaterialesParaDescuento(itemFinal.prestacion)
        setItemPendienteDescuento(itemFinal)
        setCategoriaDetectada(categoria)
        setMaterialesDisponibles(materiales)
      } catch (e: unknown) {
        log.error('Error al preparar modal de descuento:', e)
      }
    }
  }

  // F2-12: Confirmar descuento desde el modal
  const handleConfirmarDescuento = (materialesSeleccionados: unknown[]): void => {
    try {
      if (Array.isArray(materialesSeleccionados) && materialesSeleccionados.length > 0) {
        descontarMateriales(materialesSeleccionados)
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
    handleCancelarDescuento,
  }
}
