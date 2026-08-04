import { useState, useMemo, useCallback, useEffect } from 'react'
import { PRESUPUESTOS_DEFAULT } from '../constants/presupuestosConstants'
import { presupuestosStorageService } from '../services/presupuestosStorageService'
import { calcularResumenPresupuestos } from '../utils/presupuestosCalculations'

export const usePresupuestos = (pacientes = []) => {
  const [presupuestosLocales, setPresupuestosLocales] = useState(() => 
    presupuestosStorageService.obtenerPresupuestos(PRESUPUESTOS_DEFAULT)
  )

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos')

  // Consolida los presupuestos emitidos localmente + los vinculados en las fichas
  const presupuestosConsolidados = useMemo(() => {
    const desdePacientes = presupuestosStorageService.consolidarPresupuestosDesdePacientes(pacientes)
    
    // Evitar duplicados si ya existen por ID
    const idsFicha = new Set(desdePacientes.map(p => p.id))
    const localesFiltrados = presupuestosLocales.filter(p => !idsFicha.has(p.id))

    return [...desdePacientes, ...localesFiltrados]
  }, [pacientes, presupuestosLocales])

  const resumen = useMemo(() => calcularResumenPresupuestos(presupuestosConsolidados), [presupuestosConsolidados])

  const presupuestosFiltrados = useMemo(() => {
    return presupuestosConsolidados.filter(p => {
      const coincideEstado = estadoFiltro === 'Todos' || p.estado === estadoFiltro
      const coincideBusqueda = !busqueda.trim() ||
        p.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.pacienteRut.includes(busqueda)
      return coincideEstado && coincideBusqueda
    })
  }, [presupuestosConsolidados, busqueda, estadoFiltro])

  const agregarPresupuesto = useCallback((nuevoPresupuesto) => {
    setPresupuestosLocales(prev => {
      const actualizados = [nuevoPresupuesto, ...prev]
      presupuestosStorageService.guardarPresupuestos(actualizados)
      return actualizados
    })
  }, [])

  const cambiarEstadoPresupuesto = useCallback((idPresupuesto, nuevoEstado) => {
    setPresupuestosLocales(prev => {
      const actualizados = prev.map(p => p.id === idPresupuesto ? { ...p, estado: nuevoEstado } : p)
      presupuestosStorageService.guardarPresupuestos(actualizados)
      return actualizados
    })
  }, [])

  const eliminarPresupuesto = useCallback((idPresupuesto) => {
    if (window.confirm('¿Estás seguro de eliminar este presupuesto cotizado?')) {
      setPresupuestosLocales(prev => {
        const actualizados = prev.filter(p => p.id !== idPresupuesto)
        presupuestosStorageService.guardarPresupuestos(actualizados)
        return actualizados
      })
    }
  }, [])

  return {
    presupuestos: presupuestosFiltrados,
    resumen,
    busqueda,
    setBusqueda,
    estadoFiltro,
    setEstadoFiltro,
    agregarPresupuesto,
    cambiarEstadoPresupuesto,
    eliminarPresupuesto
  }
}