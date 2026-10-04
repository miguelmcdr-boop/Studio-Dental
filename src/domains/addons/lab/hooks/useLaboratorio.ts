import { useState, useMemo, useCallback } from 'react'
import {
  ORDENES_DEFAULT,
  LABORATORIOS_BASE,
  type OrdenLaboratorio,
  type LaboratorioBase
} from '../constants/laboratorioConstants'
import { laboratorioStorageService } from '../services/laboratorioStorageService'
import {
  calcularResumenLaboratorio,
  type ResumenLaboratorio
} from '../utils/laboratorioCalculations'
import { useAppDialog } from '../../../../shared/hooks/useAppDialog'

export type LabDataInput = Partial<LaboratorioBase> & {
  nombre: string
  id?: number | string
}

export interface UseLaboratorioReturn {
  ordenes: OrdenLaboratorio[]
  laboratorios: LaboratorioBase[]
  resumen: ResumenLaboratorio
  busqueda: string
  setBusqueda: React.Dispatch<React.SetStateAction<string>>
  etapaFiltro: string
  setEtapaFiltro: React.Dispatch<React.SetStateAction<string>>
  agregarOrden: (nuevaOrden: OrdenLaboratorio) => void
  actualizarEtapaOrden: (idOrden: number | string, nuevaEtapa: string) => void
  cambiarEstadoPagoOrden: (idOrden: number | string, nuevoEstadoPago: string) => void
  eliminarOrden: (idOrden: number | string) => Promise<void>
  guardarOActualizarLaboratorio: (labData: LabDataInput) => void
  eliminarLaboratorio: (idLab: number | string) => Promise<void>
}

export const useLaboratorio = (): UseLaboratorioReturn => {
  const { confirm } = useAppDialog()
  const [ordenes, setOrdenes] = useState<OrdenLaboratorio[]>(() =>
    laboratorioStorageService.obtenerOrdenes([...ORDENES_DEFAULT])
  )
  const [laboratorios, setLaboratorios] = useState<LaboratorioBase[]>(() =>
    laboratorioStorageService.obtenerLaboratorios([...LABORATORIOS_BASE])
  )

  const [busqueda, setBusqueda] = useState<string>('')
  const [etapaFiltro, setEtapaFiltro] = useState<string>('Todas')

  const resumen = useMemo(() => calcularResumenLaboratorio(ordenes), [ordenes])

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      const coincideEtapa = etapaFiltro === 'Todas' || o.etapa === etapaFiltro
      const coincideBusqueda =
        !busqueda.trim() ||
        o.codigoOrden.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.tipoTrabajo.toLowerCase().includes(busqueda.toLowerCase()) ||
        o.laboratorioNombre.toLowerCase().includes(busqueda.toLowerCase())
      return coincideEtapa && coincideBusqueda
    })
  }, [ordenes, busqueda, etapaFiltro])

  const agregarOrden = useCallback((nuevaOrden: OrdenLaboratorio) => {
    setOrdenes(prev => {
      const actualizadas = [nuevaOrden, ...prev]
      laboratorioStorageService.guardarOrdenes(actualizadas)
      return actualizadas
    })
  }, [])

  const actualizarEtapaOrden = useCallback((idOrden: number | string, nuevaEtapa: string) => {
    setOrdenes(prev => {
      const actualizadas = prev.map(o =>
        o.id === idOrden ? { ...o, etapa: nuevaEtapa } : o
      )
      laboratorioStorageService.guardarOrdenes(actualizadas)
      return actualizadas
    })
  }, [])

  const cambiarEstadoPagoOrden = useCallback(
    (idOrden: number | string, nuevoEstadoPago: string) => {
      setOrdenes(prev => {
        const actualizadas = prev.map(o =>
          o.id === idOrden ? { ...o, estadoPagoLab: nuevoEstadoPago } : o
        )
        laboratorioStorageService.guardarOrdenes(actualizadas)
        return actualizadas
      })
    },
    []
  )

  const eliminarOrden = useCallback(
    async (idOrden: number | string) => {
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
    },
    [confirm]
  )

  const guardarOActualizarLaboratorio = useCallback((labData: LabDataInput) => {
    setLaboratorios(prev => {
      let actualizados: LaboratorioBase[] = []
      const existe = prev.some(l => l.id === labData.id)

      if (existe) {
        actualizados = prev.map(l =>
          l.id === labData.id
            ? ({
                ...l,
                ...labData
              } as LaboratorioBase)
            : l
        )
      } else {
        const nuevoLab: LaboratorioBase = {
          id: labData.id ?? Date.now(),
          nombre: labData.nombre,
          contacto: labData.contacto ?? '',
          telefono: labData.telefono ?? '',
          email: labData.email ?? '',
          direccion: labData.direccion ?? '',
          tarifas: labData.tarifas ?? []
        }
        actualizados = [nuevoLab, ...prev]
      }

      laboratorioStorageService.guardarLaboratorios(actualizados)
      return actualizados
    })
  }, [])

  const eliminarLaboratorio = useCallback(
    async (idLab: number | string) => {
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
    },
    [confirm]
  )

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
