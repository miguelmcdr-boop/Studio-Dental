/**
 * usePresupuestoItems — Hook para gestión de items del presupuesto (F7-25)
 * 
 * Extraído de usePresupuestoForm.js para cumplir límite arquitectónico (F3-02).
 * Gestiona la selección de prestaciones, descuentos por convenio y CRUD de items.
 */
import { useState } from 'react'
import { obtenerDescuentoConvenio } from '../utils/pacientesCalculations'
import { pacientesStorageService } from '../services/pacientesStorageService'

export const usePresupuestoItems = ({
  paciente,
  arancelActualizado,
  convenioAplicado,
  itemsPresupuesto,
  setItemsPresupuesto
}) => {
  const [piezaPresupuesto, setPiezaPresupuesto] = useState('')
  const [prestacionSeleccionadaId, setPrestacionSeleccionadaId] = useState('')
  const [nombrePrestacion, setNombrePrestacion] = useState('')
  const [valorPrestacion, setValorPrestacion] = useState('')
  const [precioBaseOriginal, setPrecioBaseOriginal] = useState(0)
  const [porcentajeDescuentoAplicado, setPorcentajeDescuentoAplicado] = useState(0)

  const handleSeleccionarPrestacion = (id, convenioNombre = convenioAplicado) => {
    setPrestacionSeleccionadaId(id)
    if (!id) return
    const prest = arancelActualizado.find(p => String(p.id) === String(id))
    if (prest) {
      const precioBase = parseFloat(prest.precio ?? prest.precioParticular) || 0
      setNombrePrestacion(prest.nombre)
      setPrecioBaseOriginal(precioBase)
      
      const pctDesc = obtenerDescuentoConvenio(convenioNombre)
      setPorcentajeDescuentoAplicado(pctDesc)
      const precioConDescuento = Math.round(precioBase * (1 - pctDesc / 100))
      setValorPrestacion(precioConDescuento)
    }
  }

  const handleCambiarConvenioSelect = (nuevoConvenio) => {
    if (prestacionSeleccionadaId) {
      handleSeleccionarPrestacion(prestacionSeleccionadaId, nuevoConvenio)
    }
  }

  const handleAgregarItemPresupuesto = (e) => {
    e.preventDefault()
    if (!nombrePrestacion || !valorPrestacion) return
    const nuevoItem = {
      id: Date.now(),
      pieza: piezaPresupuesto || 'General',
      prestacion: nombrePrestacion,
      convenio: convenioAplicado,
      precioBase: precioBaseOriginal || parseInt(valorPrestacion),
      descuentoPct: porcentajeDescuentoAplicado,
      valor: parseInt(valorPrestacion),
      estado: 'Pendiente'
    }
    const actualizados = [...itemsPresupuesto, nuevoItem]
    setItemsPresupuesto(actualizados)
    pacientesStorageService.guardarItem(`presupuesto_items_${paciente.id}`, actualizados)
    setPiezaPresupuesto('')
    setPrestacionSeleccionadaId('')
    setNombrePrestacion('')
    setValorPrestacion('')
    setPrecioBaseOriginal(0)
    setPorcentajeDescuentoAplicado(0)
  }

  const handleEliminarItem = (id) => {
    const actualizados = itemsPresupuesto.filter(i => i.id !== id)
    setItemsPresupuesto(actualizados)
    pacientesStorageService.guardarItem(`presupuesto_items_${paciente.id}`, actualizados)
  }

  return {
    piezaPresupuesto,
    prestacionSeleccionadaId,
    nombrePrestacion,
    valorPrestacion,
    precioBaseOriginal,
    porcentajeDescuentoAplicado,
    handleSeleccionarPrestacion,
    handleCambiarConvenioSelect,
    handleAgregarItemPresupuesto,
    handleEliminarItem,
    setPiezaPresupuesto,
    setNombrePrestacion,
    setValorPrestacion
  }
}
