/**
 * usePresupuestoForm — Hook coordinador de formulario de presupuesto (F7-25)
 * 
 * Refactorizado en F3-02: extraída lógica de items a usePresupuestoItems.js
 * Este hook ahora solo coordina entre items y abonos.
 */
import { useState, useEffect } from 'react'
import { prestacionesStorageService } from '../../prestaciones/services/prestacionesStorageService'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { pagosStorageService } from '../../pagos/services/pagosStorageService'
import { useEliminarAbono } from './useEliminarAbono'
import { usePresupuestoItems } from './usePresupuestoItems'

export const usePresupuestoForm = ({
  paciente,
  prestacionesProp = [],
  itemsPresupuesto = [],
  setItemsPresupuesto = () => {},
  abonos = [],
  setAbonos = () => {}
}) => {
  // Estados de arancel y convenio
  const [arancelActualizado, setArancelActualizado] = useState(() => {
    const actuales = prestacionesStorageService.obtenerPrestaciones()
    return Array.isArray(actuales) && actuales.length > 0 ? actuales : prestacionesProp
  })
  const [convenioAplicado, setConvenioAplicado] = useState(paciente.prevision || 'Particular')

  // Estados de abono
  const [montoAbono, setValorAbono] = useState('')
  const [metodoPagoAbono, setMetodoPagoAbono] = useState('Efectivo')

  // Hook de items
  const itemsHook = usePresupuestoItems({
    paciente,
    arancelActualizado,
    convenioAplicado,
    itemsPresupuesto,
    setItemsPresupuesto
  })

  // Sincronización con arancel global (F2-07a)
  useEffect(() => {
    const handleRefrescarArancel = () => {
      const actuales = prestacionesStorageService.obtenerPrestaciones()
      if (Array.isArray(actuales) && actuales.length > 0) setArancelActualizado(actuales)
    }
    window.addEventListener('storage', handleRefrescarArancel)
    window.addEventListener('arancel_actualizado', handleRefrescarArancel)
    return () => {
      window.removeEventListener('storage', handleRefrescarArancel)
      window.removeEventListener('arancel_actualizado', handleRefrescarArancel)
    }
  }, [])

  useEffect(() => {
    if (prestacionesProp?.length > 0) setArancelActualizado(prestacionesProp)
  }, [prestacionesProp])

  const handleAgregarAbono = (e) => {
    e.preventDefault()
    if (!montoAbono) return
    const abonoObj = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      monto: parseInt(montoAbono),
      metodoPago: metodoPagoAbono,
      pacienteNombre: paciente.nombre
    }
    const actualizados = [abonoObj, ...abonos]
    setAbonos(actualizados)
    pacientesStorageService.guardarItem(`abonos_${paciente.id}`, actualizados)

    // BUG-ABONOS-PAGOS: sincronizar con módulo Pagos
    pagosStorageService.crearPagoDesdeAbono(paciente, abonoObj)

    setValorAbono('')
  }

  const { handleEliminarAbono } = useEliminarAbono({
    abonos,
    setAbonos,
    paciente,
  })

  const handleCambiarConvenioSelect = (nuevoConvenio) => {
    setConvenioAplicado(nuevoConvenio)
    itemsHook.handleCambiarConvenioSelect(nuevoConvenio)
  }

  return {
    ...itemsHook,
    arancelActualizado,
    convenioAplicado,
    montoAbono,
    metodoPagoAbono,
    handleAgregarAbono,
    handleEliminarAbono,
    handleCambiarConvenioSelect,
    setValorAbono,
    setMetodoPagoAbono
  }
}
