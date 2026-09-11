import { useState, useEffect, useCallback, useMemo } from 'react'
import { presupuestosStorageService } from '../services/presupuestosStorageService'
import { calcularResumenPresupuestos } from '../utils/presupuestosCalculations'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const usePresupuestos = (pacientes = [], _prestaciones = []) => {
  const { confirm } = useAppDialog()
  const [presupuestos, setPresupuestos] = useState([])
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [presupuestoImprimir, setPresupuestoImprimir] = useState(null)
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  const cargarPresupuestos = useCallback(() => {
    // Solo presupuestos formales (creados manualmente desde PresupuestosModulo).
    // Los consolidados virtuales (PRES-PAC-*) quedan solo en la Ficha Clínica
    // del paciente, no aparecen en este módulo para evitar confusión
    // (su estado se calcula desde items del plan, no desde presupuestos formales).
    const creadosDirectos = presupuestosStorageService.obtenerPresupuestos([])
    setPresupuestos(creadosDirectos)
  }, [pacientes])

  useEffect(() => {
    cargarPresupuestos()
    window.addEventListener('storage', cargarPresupuestos)
    window.addEventListener('presupuestos_actualizados', cargarPresupuestos)
    return () => {
      window.removeEventListener('storage', cargarPresupuestos)
      window.removeEventListener('presupuestos_actualizados', cargarPresupuestos)
    }
  }, [cargarPresupuestos])

  const agregarPresupuesto = useCallback((nuevoPresupuesto) => {
    const directos = presupuestosStorageService.obtenerPresupuestos([])
    const actualizados = [nuevoPresupuesto, ...directos]
    presupuestosStorageService.guardarPresupuestos(actualizados)
    cargarPresupuestos()
  }, [cargarPresupuestos])

  const cambiarEstadoPresupuesto = useCallback((presupuestoId, nuevoEstado) => {
    presupuestosStorageService.actualizarEstadoPresupuesto(presupuestoId, nuevoEstado)
    cargarPresupuestos()
  }, [cargarPresupuestos])

  const eliminarPresupuesto = useCallback(async (presupuestoId, pacienteId, items = []) => {
    const ok = await confirm({
      title: 'Eliminar presupuesto',
      description: '¿Estás seguro de eliminar este presupuesto? Se eliminará también del plan de tratamiento del paciente.',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      presupuestosStorageService.eliminarPresupuestoYFicha(presupuestoId, pacienteId, items)
      cargarPresupuestos()
    }
  }, [cargarPresupuestos])

  const resumen = useMemo(() => calcularResumenPresupuestos(presupuestos), [presupuestos])

  const presupuestosFiltrados = useMemo(() => {
    return presupuestos.filter(p => {
      const coincideEstado = estadoFiltro === 'Todos' || p.estado === estadoFiltro
      const texto = busqueda.trim().toLowerCase()
      const coincideBusqueda = !texto ||
        p.folio?.toLowerCase().includes(texto) ||
        p.pacienteNombre?.toLowerCase().includes(texto) ||
        p.pacienteRut?.toLowerCase().includes(texto)
      return coincideEstado && coincideBusqueda
    })
  }, [presupuestos, estadoFiltro, busqueda])

  return {
    presupuestos: presupuestosFiltrados,
    resumen,
    modalNuevoAbierto,
    setModalNuevoAbierto,
    presupuestoImprimir,
    setPresupuestoImprimir,
    estadoFiltro,
    setEstadoFiltro,
    busqueda,
    setBusqueda,
    agregarPresupuesto,
    cambiarEstadoPresupuesto,
    eliminarPresupuesto
  }
}