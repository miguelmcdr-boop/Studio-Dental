import { useState, useEffect, useCallback } from 'react'
import { presupuestosStorageService } from '../services/presupuestosStorageService'

export const usePresupuestos = (pacientes = [], prestaciones = []) => {
  const [presupuestos, setPresupuestos] = useState([])
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [presupuestoImprimir, setPresupuestoImprimir] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
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

  const guardarNuevoPresupuesto = useCallback((nuevoPresupuesto) => {
    const directos = presupuestosStorageService.obtenerPresupuestos([])
    const actualizados = [nuevoPresupuesto, ...directos]
    presupuestosStorageService.guardarPresupuestos(actualizados)
    cargarPresupuestos()
  }, [cargarPresupuestos])

  const eliminarPresupuesto = useCallback((presupuestoId, pacienteId, items = []) => {
    if (confirm('¿Estás seguro de eliminar este presupuesto? Se eliminará también del plan de tratamiento del paciente.')) {
      presupuestosStorageService.eliminarPresupuestoYFicha(presupuestoId, pacienteId, items)
      cargarPresupuestos()
    }
  }, [cargarPresupuestos])

  return {
    presupuestos,
    modalNuevoAbierto,
    setModalNuevoAbierto,
    presupuestoImprimir,
    setPresupuestoImprimir,
    filtroEstado,
    setFiltroEstado,
    busqueda,
    setBusqueda,
    guardarNuevoPresupuesto,
    eliminarPresupuesto
  }
}