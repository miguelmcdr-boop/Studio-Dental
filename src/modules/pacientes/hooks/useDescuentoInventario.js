/**
 * useDescuentoInventario — Hook de lógica de descuento de inventario
 * Extraído de usePresupuesto.js para cumplir límites arquitectónicos (F7-25)
 * F2-12: descuento de inventario con modal de selección
 */
import { useState } from 'react'
import { descontarMaterialesSeleccionados, detectarCategoriaTratamiento, PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT } from '../../inventario/utils/inventarioCalculations'
import { inventarioStorageService } from '../../inventario/services/inventarioStorageService'
import { evolucionesStorageService } from '../services/evolucionesStorageService'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('useDescuentoInventario')
const STORAGE_KEY_PALABRAS_CLAVE = 'studio_dental_inventario_palabras_clave'

export const useDescuentoInventario = ({
  paciente,
  userProfile,
  itemsPresupuesto = [],
  setItemsPresupuesto = () => {},
  evolucionesNotas = [],
  setEvolucionesNotas = () => {}
}) => {
  const [itemPendienteDescuento, setItemPendienteDescuento] = useState(null)
  const [categoriaDetectada, setCategoriaDetectada] = useState('')
  const [materialesDisponibles, setMaterialesDisponibles] = useState([])

  // F2-12: Cambiar estado de item con cohesión clínica y descuento de inventario
  const handleCambiarEstadoItem = (id, nuevoEstado) => {
    let itemRealizado = null

    const actualizados = itemsPresupuesto.map(item => {
      if (item.id === id) {
        if (nuevoEstado === 'Realizado' && item.estado !== 'Realizado') {
          itemRealizado = item
        }
        return { ...item, estado: nuevoEstado }
      }
      return item
    })

    setItemsPresupuesto(actualizados)

    if (itemRealizado) {
      // 1. Cohesión con Bitácora de Evoluciones
      if (setEvolucionesNotas) {
        const fechaHora = new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        const profesional = userProfile?.nombreCompleto || 'Cirujano Dentista'
        
        const nuevaNotaEvolucion = {
          id: Date.now(),
          fecha: fechaHora,
          texto: `✅ TRATAMIENTO REALIZADO: ${itemRealizado.prestacion} (Pieza: ${itemRealizado.pieza}) — Ejecutado por: ${profesional}`
        }

        const notasActualizadas = [nuevaNotaEvolucion, ...evolucionesNotas]
        setEvolucionesNotas(notasActualizadas)
        evolucionesStorageService.guardarEvoluciones(paciente.id, notasActualizadas).catch(err => log.warn("Error al guardar:", err))
      }

      // 2. F2-12: Abrir modal de selección de materiales
      try {
        const asociaciones = inventarioStorageService.obtenerAsociacionesInsumos()
        
        let palabrasClave = PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT
        try {
          const palabrasGuardadas = localStorage.getItem(STORAGE_KEY_PALABRAS_CLAVE)
          if (palabrasGuardadas) {
            palabrasClave = JSON.parse(palabrasGuardadas)
          }
        } catch {
          // Usar default si hay error
        }
        
        const categoria = detectarCategoriaTratamiento(itemRealizado.prestacion, asociaciones, palabrasClave)
        const materialesCategoria = asociaciones[categoria] || []
        const inventarioActual = inventarioStorageService.obtenerItems([])
        
        const materialesEnriquecidos = materialesCategoria
          .filter(m => m.itemId)
          .map(m => {
            const itemInventario = inventarioActual.find(i => i.id === m.itemId)
            return {
              itemId: m.itemId,
              nombreInsumo: itemInventario?.nombre || m.nombreInsumo,
              cantidad: m.cantidad,
              unidad: itemInventario?.unidad || m.unidad || 'Unidad',
              stockActual: parseFloat(itemInventario?.cantidad) || 0
            }
          })
        
        setItemPendienteDescuento(itemRealizado)
        setCategoriaDetectada(categoria)
        setMaterialesDisponibles(materialesEnriquecidos)
      } catch (e) {
        log.error('Error al preparar modal de descuento:', e)
      }
    }
  }

  // F2-12: Confirmar descuento desde el modal
  const handleConfirmarDescuento = (materialesSeleccionados) => {
    try {
      const inventarioGuardado = inventarioStorageService.obtenerItems([])
      if (Array.isArray(inventarioGuardado) && inventarioGuardado.length > 0 && materialesSeleccionados.length > 0) {
        const inventarioActualizado = descontarMaterialesSeleccionados(inventarioGuardado, materialesSeleccionados)
        inventarioStorageService.guardarItems(inventarioActualizado)
        window.dispatchEvent(new CustomEvent('inventario_actualizado'))
      }
    } catch (e) {
      log.error('Error al descontar inventario:', e)
    } finally {
      setItemPendienteDescuento(null)
      setCategoriaDetectada('')
      setMaterialesDisponibles([])
    }
  }

  // F2-12: Cancelar descuento desde el modal
  const handleCancelarDescuento = () => {
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
