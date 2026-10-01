/**
 * usePresupuesto — Hook orquestador de presupuesto de paciente
 * Combina usePresupuestoForm + useDescuentoInventario (F7-25)
 * F2-07a: sincronización con arancel global
 * F2-12: descuento de inventario con modal de selección
 */
import { usePresupuestoForm } from './usePresupuestoForm'
import { useDescuentoInventario } from './useDescuentoInventario'

export const usePresupuesto = (props) => {
  const form = usePresupuestoForm(props)
  const descuento = useDescuentoInventario(props)

  return {
    ...form,
    ...descuento
  }
}
