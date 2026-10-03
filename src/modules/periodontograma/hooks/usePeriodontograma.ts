import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  crearPiezaVaciaSchema,
  crearControlPeriodontalSchema,
  type ControlPeriodontal,
  type PiezaPeriodontal
} from '../schemas/periodontalSchema'
import { sanitizarSondaje, sanitizarRecesion } from '../utils/periodontalValidation'
import {
  calcularEstadisticasPeriodontales,
  generarResumenClinico,
  estructurarDatosParaGrafico
} from '../utils/periodontalCalculations'
import { periodontogramaStorageService } from '../services/periodontogramaStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('usePeriodontograma')

export interface UsePeriodontogramaReturn {
  datosPeriodontales: Record<string, PiezaPeriodontal>
  metricas: unknown
  resumenClinico: unknown
  datosGrafico: unknown
  historialControles: ControlPeriodontal[]
  controlActivoId: string | number | undefined
  setControlActivoId: React.Dispatch<
    React.SetStateAction<string | number | undefined>
  >
  crearNuevoControl: (observacion?: string) => void
  actualizarSondaje: (
    piezaId: string | number,
    sitioId: string,
    valorRaw: unknown
  ) => void
  actualizarRecesion: (
    piezaId: string | number,
    sitioId: string,
    valorRaw: unknown
  ) => void
  toggleFlagSitio: (
    piezaId: string | number,
    campoFlag: 'sangrado' | 'placa' | 'supuracion',
    sitioId: string
  ) => void
  actualizarAtributoGlobalPieza: (
    piezaId: string | number,
    campo: keyof PiezaPeriodontal | string,
    valor: unknown
  ) => void
  togglePiezaAusente: (piezaId: string | number) => void
  togglePiezaImplante: (piezaId: string | number) => void
}

export const usePeriodontograma = (
  pacienteId: string | number | null | undefined
): UsePeriodontogramaReturn => {
  const [historialControles, setHistorialControles] = useState<
    ControlPeriodontal[]
  >(() => {
    try {
      // F2-07b: cargar vía servicio (antes localStorage directo)
      const saved = periodontogramaStorageService.obtenerHistorialControles<
        ControlPeriodontal[] | null
      >(pacienteId, null)
      if (saved) {
        return Array.isArray(saved) ? saved : [crearControlPeriodontalSchema()]
      }
      return [crearControlPeriodontalSchema()]
    } catch {
      return [crearControlPeriodontalSchema()]
    }
  })

  const [controlActivoId, setControlActivoId] = useState<
    string | number | undefined
  >(() => historialControles[0]?.id)

  // F2-07b: persistir vía servicio (antes localStorage directo)
  useEffect(() => {
    try {
      void periodontogramaStorageService.guardarHistorialControles(
        pacienteId,
        historialControles
      )
    } catch (e) {
      log.error('Error al guardar historial:', e)
    }
  }, [historialControles, pacienteId])

  const controlActivo = useMemo(() => {
    return (
      historialControles.find(c => c.id === controlActivoId) ||
      historialControles[0]
    )
  }, [historialControles, controlActivoId])

  const datosPeriodontales = useMemo(
    () => controlActivo?.piezas || {},
    [controlActivo]
  )

  const metricas = useMemo(() => {
    return calcularEstadisticasPeriodontales(datosPeriodontales)
  }, [datosPeriodontales])

  const resumenClinico = useMemo(() => {
    return generarResumenClinico(metricas, datosPeriodontales)
  }, [metricas, datosPeriodontales])

  const datosGrafico = useMemo(() => {
    return estructurarDatosParaGrafico(datosPeriodontales)
  }, [datosPeriodontales])

  const actualizarPieza = useCallback(
    (
      piezaId: string | number,
      callbackMutacion: (pieza: PiezaPeriodontal) => PiezaPeriodontal
    ) => {
      setHistorialControles(prevHistorial => {
        return prevHistorial.map(ctrl => {
          if (ctrl.id !== controlActivoId) return ctrl

          const piezasActuales = ctrl.piezas || {}
          const idStr = String(piezaId)
          const piezaPrev = piezasActuales[idStr] || crearPiezaVaciaSchema()
          const piezaActualizada = callbackMutacion(piezaPrev)

          return {
            ...ctrl,
            piezas: { ...piezasActuales, [idStr]: piezaActualizada }
          }
        })
      })
    },
    [controlActivoId]
  )

  const actualizarSondaje = useCallback(
    (piezaId: string | number, sitioId: string, valorRaw: unknown) => {
      actualizarPieza(piezaId, pieza => ({
        ...pieza,
        sondaje: {
          ...pieza.sondaje,
          [sitioId]: sanitizarSondaje(valorRaw as string)
        }
      }))
    },
    [actualizarPieza]
  )

  const actualizarRecesion = useCallback(
    (piezaId: string | number, sitioId: string, valorRaw: unknown) => {
      actualizarPieza(piezaId, pieza => ({
        ...pieza,
        recesion: {
          ...pieza.recesion,
          [sitioId]: sanitizarRecesion(valorRaw as string)
        }
      }))
    },
    [actualizarPieza]
  )

  const toggleFlagSitio = useCallback(
    (
      piezaId: string | number,
      campoFlag: 'sangrado' | 'placa' | 'supuracion',
      sitioId: string
    ) => {
      actualizarPieza(piezaId, pieza => {
        const mapaActual = (pieza[campoFlag] as unknown as Record<string, boolean>) || {}
        return {
          ...pieza,
          [campoFlag]: { ...mapaActual, [sitioId]: !mapaActual[sitioId] }
        }
      })
    },
    [actualizarPieza]
  )

  const actualizarAtributoGlobalPieza = useCallback(
    (
      piezaId: string | number,
      campo: keyof PiezaPeriodontal | string,
      valor: unknown
    ) => {
      actualizarPieza(piezaId, pieza => ({ ...pieza, [campo]: valor }))
    },
    [actualizarPieza]
  )

  const togglePiezaAusente = useCallback(
    (piezaId: string | number) => {
      actualizarPieza(piezaId, pieza => ({
        ...pieza,
        ausente: !pieza.ausente
      }))
    },
    [actualizarPieza]
  )

  const togglePiezaImplante = useCallback(
    (piezaId: string | number) => {
      actualizarPieza(piezaId, pieza => ({
        ...pieza,
        implante: !pieza.implante
      }))
    },
    [actualizarPieza]
  )

  const crearNuevoControl = useCallback((observacion?: string) => {
    const nuevoControl = crearControlPeriodontalSchema(Date.now(), observacion)
    setHistorialControles(prev => [nuevoControl, ...prev])
    setControlActivoId(nuevoControl.id)
  }, [])

  return {
    datosPeriodontales,
    metricas,
    resumenClinico,
    datosGrafico,
    historialControles,
    controlActivoId,
    setControlActivoId,
    crearNuevoControl,
    actualizarSondaje,
    actualizarRecesion,
    toggleFlagSitio,
    actualizarAtributoGlobalPieza,
    togglePiezaAusente,
    togglePiezaImplante
  }
}
