import { useState, useMemo, useCallback } from 'react'
import {
  CARGAS_DEFAULT,
  PRUEBAS_BIOLOGICAS_DEFAULT,
  TEST_BOWIE_DICK_DEFAULT,
  type CargaEsterilizacion,
  type PruebaBiologica,
  type TestBowieDick
} from '../constants/esterilizacionConstants'
import { esterilizacionStorageService } from '../services/esterilizacionStorageService'
import {
  calcularResumenEsterilizacion,
  type ResumenEsterilizacion
} from '../utils/esterilizacionCalculations'
import { useAppDialog } from '../../../../hooks/useAppDialog'

export interface UseEsterilizacionReturn {
  cargas: CargaEsterilizacion[]
  cargasTotales: CargaEsterilizacion[]
  biologicos: PruebaBiologica[]
  testDiarios: TestBowieDick[]
  resumen: ResumenEsterilizacion
  busqueda: string
  setBusqueda: React.Dispatch<React.SetStateAction<string>>
  equipoFiltro: string
  setEquipoFiltro: React.Dispatch<React.SetStateAction<string>>
  agregarCarga: (nuevaCarga: CargaEsterilizacion) => void
  eliminarCarga: (idCarga: number | string) => Promise<void>
  agregarBiologico: (nuevoBio: PruebaBiologica) => void
  actualizarResultadoBiologico: (idBio: number | string, nuevoResultado: string) => void
  agregarTestDiario: (nuevoTest: TestBowieDick) => void
}

export const useEsterilizacion = (): UseEsterilizacionReturn => {
  const { confirm } = useAppDialog()
  const [cargas, setCargas] = useState<CargaEsterilizacion[]>(() =>
    esterilizacionStorageService.obtenerCargas([...CARGAS_DEFAULT])
  )
  const [biologicos, setBiologicos] = useState<PruebaBiologica[]>(() =>
    esterilizacionStorageService.obtenerBiologicos([...PRUEBAS_BIOLOGICAS_DEFAULT])
  )
  const [testDiarios, setTestDiarios] = useState<TestBowieDick[]>(() =>
    esterilizacionStorageService.obtenerTestDiarios([...TEST_BOWIE_DICK_DEFAULT])
  )

  const [busqueda, setBusqueda] = useState<string>('')
  const [equipoFiltro, setEquipoFiltro] = useState<string>('Todos')

  const resumen = useMemo(
    () => calcularResumenEsterilizacion(cargas, biologicos, testDiarios),
    [cargas, biologicos, testDiarios]
  )

  const cargasFiltradas = useMemo(() => {
    return cargas.filter(c => {
      const coincideEquipo = equipoFiltro === 'Todos' || c.equipo === equipoFiltro
      const coincideBusqueda =
        !busqueda.trim() ||
        c.lote.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.contenido.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.responsable.toLowerCase().includes(busqueda.toLowerCase())
      return coincideEquipo && coincideBusqueda
    })
  }, [cargas, busqueda, equipoFiltro])

  const agregarCarga = useCallback((nuevaCarga: CargaEsterilizacion) => {
    setCargas(prev => {
      const actualizadas = [nuevaCarga, ...prev]
      esterilizacionStorageService.guardarCargas(actualizadas)
      return actualizadas
    })
  }, [])

  const eliminarCarga = useCallback(
    async (idCarga: number | string) => {
      const ok = await confirm({
        title: 'Eliminar carga',
        description: '¿Estás seguro de eliminar este registro de carga de autoclave?',
        variant: 'danger',
        confirmText: 'Eliminar'
      })
      if (ok) {
        setCargas(prev => {
          const actualizadas = prev.filter(c => c.id !== idCarga)
          esterilizacionStorageService.guardarCargas(actualizadas)
          return actualizadas
        })
      }
    },
    [confirm]
  )

  const agregarBiologico = useCallback((nuevoBio: PruebaBiologica) => {
    setBiologicos(prev => {
      const actualizados = [nuevoBio, ...prev]
      esterilizacionStorageService.guardarBiologicos(actualizados)
      return actualizados
    })
  }, [])

  const actualizarResultadoBiologico = useCallback(
    (idBio: number | string, nuevoResultado: string) => {
      setBiologicos(prev => {
        const actualizados = prev.map(b =>
          b.id === idBio ? { ...b, resultado: nuevoResultado } : b
        )
        esterilizacionStorageService.guardarBiologicos(actualizados)
        return actualizados
      })
    },
    []
  )

  const agregarTestDiario = useCallback((nuevoTest: TestBowieDick) => {
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
