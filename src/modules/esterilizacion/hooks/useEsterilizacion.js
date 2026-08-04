import { useState, useMemo, useCallback } from 'react'
import { CARGAS_DEFAULT, PRUEBAS_BIOLOGICAS_DEFAULT, TEST_BOWIE_DICK_DEFAULT } from '../constants/esterilizacionConstants'
import { esterilizacionStorageService } from '../services/esterilizacionStorageService'
import { calcularResumenEsterilizacion } from '../utils/esterilizacionCalculations'

export const useEsterilizacion = () => {
  const [cargas, setCargas] = useState(() => esterilizacionStorageService.obtenerCargas(CARGAS_DEFAULT))
  const [biologicos, setBiologicos] = useState(() => esterilizacionStorageService.obtenerBiologicos(PRUEBAS_BIOLOGICAS_DEFAULT))
  const [testDiarios, setTestDiarios] = useState(() => esterilizacionStorageService.obtenerTestDiarios(TEST_BOWIE_DICK_DEFAULT))
  
  const [busqueda, setBusqueda] = useState('')
  const [equipoFiltro, setEquipoFiltro] = useState('Todos')

  const resumen = useMemo(() => calcularResumenEsterilizacion(cargas, biologicos, testDiarios), [cargas, biologicos, testDiarios])

  const cargasFiltradas = useMemo(() => {
    return cargas.filter(c => {
      const coincideEquipo = equipoFiltro === 'Todos' || c.equipo === equipoFiltro
      const coincideBusqueda = !busqueda.trim() ||
        c.lote.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.contenido.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.responsable.toLowerCase().includes(busqueda.toLowerCase())
      return coincideEquipo && coincideBusqueda
    })
  }, [cargas, busqueda, equipoFiltro])

  const agregarCarga = useCallback((nuevaCarga) => {
    setCargas(prev => {
      const actualizadas = [nuevaCarga, ...prev]
      esterilizacionStorageService.guardarCargas(actualizadas)
      return actualizadas
    })
  }, [])

  const eliminarCarga = useCallback((idCarga) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de carga de autoclave?')) {
      setCargas(prev => {
        const actualizadas = prev.filter(c => c.id !== idCarga)
        esterilizacionStorageService.guardarCargas(actualizadas)
        return actualizadas
      })
    }
  }, [])

  const agregarBiologico = useCallback((nuevoBio) => {
    setBiologicos(prev => {
      const actualizados = [nuevoBio, ...prev]
      esterilizacionStorageService.guardarBiologicos(actualizados)
      return actualizados
    })
  }, [])

  const actualizarResultadoBiologico = useCallback((idBio, nuevoResultado) => {
    setBiologicos(prev => {
      const actualizados = prev.map(b => b.id === idBio ? { ...b, resultado: nuevoResultado } : b)
      esterilizacionStorageService.guardarBiologicos(actualizados)
      return actualizados
    })
  }, [])

  const agregarTestDiario = useCallback((nuevoTest) => {
    setTestDiarios(prev => {
      const actualizados = [nuevoTest, ...prev]
      esterilizacionStorageService.guardarTestDiarios(actualizados)
      return actualizados
    })
  }, [])

  return {
    cargas: cargasFiltradas,
    cargasTotales: cargas,
    biologicos,
    testDiarios,
    resumen,
    busqueda,
    setBusqueda,
    equipoFiltro,
    setEquipoFiltro,
    agregarCarga,
    eliminarCarga,
    agregarBiologico,
    actualizarResultadoBiologico,
    agregarTestDiario
  }
}