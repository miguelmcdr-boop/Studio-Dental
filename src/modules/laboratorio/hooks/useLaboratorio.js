import { useState, useMemo, useCallback } from 'react'
import { ORDENES_DEFAULT, LABORATORIOS_BASE } from '../constants/laboratorioConstants'
import { laboratorioStorageService } from '../services/laboratorioStorageService'
import { calcularResumenLaboratorio } from '../utils/laboratorioCalculations'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const useLaboratorio = () => {
  const { confirm } = useAppDialog()
  const [ordenes, setOrdenes] = useState(() => laboratorioStorageService.obtenerOrdenes(ORDENES_DEFAULT))
  const [laboratorios, setLaboratorios] = useState(() => laboratorioStorageService.obtenerLaboratorios(LABORATORIOS_BASE))
  
  const [busqueda, setBusqueda] = useState('')
  const [etapaFiltro, setEtapaFiltro] = useState('Todas')

  const resumen = useMemo(() => calcularResumenLaboratorio(ordenes), [ordenes])

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      const coincideEtapa = etapaFiltro === 'Todas' || o.etapa === etapaFiltro
      const coincideBusqueda = !busqueda.trim() ||
        o.codigoOrden.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.tipoTrabajo.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.laboratorioNombre.toLowerCase().includes(busqueda.toLowerCase())
      return coincideEtapa && coincideBusqueda
    })
  }, [ordenes, busqueda, etapaFiltro])

  const agregarOrden = useCallback((nuevaOrden) => {
    setOrdenes(prev => {
      const actualizadas = [nuevaOrden, ...prev]
      laboratorioStorageService.guardarOrdenes(actualizadas)
      return actualizadas
    })
  }, [])

  const actualizarEtapaOrden = useCallback((idOrden, nuevaEtapa) => {
    setOrdenes(prev => {
      const actualizadas = prev.map(o => o.id === idOrden ? { ...o, etapa: nuevaEtapa } : o)
      laboratorioStorageService.guardarOrdenes(actualizadas)
      return actualizadas
    })
  }, [])

  const cambiarEstadoPagoOrden = useCallback((idOrden, nuevoEstadoPago) => {
    setOrdenes(prev => {
      const actualizadas = prev.map(o => o.id === idOrden ? { ...o, estadoPagoLab: nuevoEstadoPago } : o)
      laboratorioStorageService.guardarOrdenes(actualizadas)
      return actualizadas
    })
  }, [])

  const eliminarOrden = useCallback(async (idOrden) => {
    const ok = await confirm({
      title: 'Eliminar orden de laboratorio',
      description: '¿Deseas eliminar esta orden de trabajo de laboratorio?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      setOrdenes(prev => {
        const actualizadas = prev.filter(o => o.id !== idOrden)
        laboratorioStorageService.guardarOrdenes(actualizadas)
        return actualizadas
      })
    }
  }, [confirm])

  const guardarOActualizarLaboratorio = useCallback((labData) => {
    setLaboratorios(prev => {
      let actualizados = []
      const existe = prev.some(l => l.id === labData.id)

      if (existe) {
        actualizados = prev.map(l => l.id === labData.id ? labData : l)
      } else {
        actualizados = [{ ...labData, id: Date.now() }, ...prev]
      }

      laboratorioStorageService.guardarLaboratorios(actualizados)
      return actualizados
    })
  }, [])

  const eliminarLaboratorio = useCallback(async (idLab) => {
    const ok = await confirm({
      title: 'Eliminar laboratorio',
      description: '¿Deseas eliminar este laboratorio de tu directorio?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      setLaboratorios(prev => {
        const actualizados = prev.filter(l => l.id !== idLab)
        laboratorioStorageService.guardarLaboratorios(actualizados)
        return actualizados
      })
    }
  }, [confirm])

  return {
    ordenes: ordenesFiltradas,
    laboratorios,
    resumen,
    busqueda,
    setBusqueda,
    etapaFiltro,
    setEtapaFiltro,
    agregarOrden,
    actualizarEtapaOrden,
    cambiarEstadoPagoOrden,
    eliminarOrden,
    guardarOActualizarLaboratorio,
    eliminarLaboratorio
  }
}