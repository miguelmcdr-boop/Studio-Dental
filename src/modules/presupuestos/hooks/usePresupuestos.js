import { useState, useEffect, useCallback, useMemo } from 'react'
import { presupuestosStorageService } from '../services/presupuestosStorageService'
import { calcularResumenPresupuestos } from '../utils/presupuestosCalculations'

export const usePresupuestos = (pacientes = [], prestaciones = []) => {
  const [presupuestos, setPresupuestos] = useState([])
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [presupuestoImprimir, setPresupuestoImprimir] = useState(null)
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  const cargarPresupuestos = useCallback(() => {
    const creadosDirectos = presupuestosStorageService.obtenerPresupuestos([])
    const consolidadosPacientes = presupuestosStorageService.consolidarPresupuestosDesdePacientes(pacientes)

    // Fusionar evitando duplicados por ID
    const mapa = new Map()
    consolidadosPacientes.forEach(p => mapa.set(String(p.id), p))
    creadosDirectos.forEach(p => mapa.set(String(p.id), p))

    setPresupuestos(Array.from(mapa.values()))
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

  const eliminarPresupuesto = useCallback((presupuestoId, pacienteId, items = []) => {
    if (confirm('¿Estás seguro de eliminar este presupuesto? Se eliminará también del plan de tratamiento del paciente.')) {
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