// Hook de formularios de presupuesto (F7-25)
import { useState, useEffect } from 'react'
import { obtenerDescuentoConvenio } from '../utils/pacientesCalculations'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { prestacionesStorageService } from '../../prestaciones/services/prestacionesStorageService'

export const usePresupuestoForm = ({
  paciente,
  prestacionesProp = [],
  itemsPresupuesto = [],
  setItemsPresupuesto = () => {},
  abonos = [],
  setAbonos = () => {}
}) => {
  // Estados de prestación
  const [arancelActualizado, setArancelActualizado] = useState(() => {
    const actuales = prestacionesStorageService.obtenerPrestaciones()
    return Array.isArray(actuales) && actuales.length > 0 ? actuales : prestacionesProp
  })
  const [convenioAplicado, setConvenioAplicado] = useState(paciente.prevision || 'Particular')
  const [piezaPresupuesto, setPiezaPresupuesto] = useState('')
  const [prestacionSeleccionadaId, setPrestacionSeleccionadaId] = useState('')
  const [nombrePrestacion, setNombrePrestacion] = useState('')
  const [valorPrestacion, setValorPrestacion] = useState('')
  const [precioBaseOriginal, setPrecioBaseOriginal] = useState(0)
  const [porcentajeDescuentoAplicado, setPorcentajeDescuentoAplicado] = useState(0)

  // Estados de abono
  const [montoAbono, setValorAbono] = useState('')
  const [metodoPagoAbono, setMetodoPagoAbono] = useState('Efectivo')

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
    setConvenioAplicado(nuevoConvenio)
    if (prestacionSeleccionadaId) handleSeleccionarPrestacion(prestacionSeleccionadaId, nuevoConvenio)
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
    setValorAbono('')
  }

  const handleEliminarAbono = (idAbono) => {
    if (!window.confirm('¿Deseas eliminar este registro de abono ingresado?')) return
    const actualizados = abonos.filter(a => a.id !== idAbono)
    setAbonos(actualizados)
    pacientesStorageService.guardarItem(`abonos_${paciente.id}`, actualizados)
  }

  return {
    arancelActualizado,
    convenioAplicado,
    piezaPresupuesto,
    prestacionSeleccionadaId,
    nombrePrestacion,
    valorPrestacion,
    precioBaseOriginal,
    porcentajeDescuentoAplicado,
    montoAbono,
    metodoPagoAbono,
    handleSeleccionarPrestacion,
    handleCambiarConvenioSelect,
    handleAgregarItemPresupuesto,
    handleEliminarItem,
    handleAgregarAbono,
    handleEliminarAbono,
    setPiezaPresupuesto,
    setNombrePrestacion,
    setValorPrestacion,
    setValorAbono,
    setMetodoPagoAbono
  }
}
