import { useState, useEffect, useMemo, useCallback } from 'react'
import { crearPiezaVaciaSchema, crearControlPeriodontalSchema } from '../schemas/periodontalSchema'
import { sanitizarSondaje, sanitizarRecesion } from '../utils/periodontalValidation'
import { calcularEstadisticasPeriodontales, generarResumenClinico, estructurarDatosParaGrafico } from '../utils/periodontalCalculations'
// F2-07b: acceso centralizado vía servicio
import { periodontogramaStorageService } from '../services/periodontogramaStorageService'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('usePeriodontograma')

export const usePeriodontograma = (pacienteId) => {
  const [historialControles, setHistorialControles] = useState(() => {
    try {
      // F2-07b: cargar vía servicio (antes localStorage directo)
      const saved = periodontogramaStorageService.obtenerHistorialControles(pacienteId, null)
      if (saved) {
        return Array.isArray(saved) ? saved : [crearControlPeriodontalSchema()]
      }
      return [crearControlPeriodontalSchema()]
    } catch {
      return [crearControlPeriodontalSchema()]
    }
  })

  const [controlActivoId, setControlActivoId] = useState(() => historialControles[0]?.id)

  // F2-07b: persistir vía servicio (antes localStorage directo)
  useEffect(() => {
    try {
      periodontogramaStorageService.guardarHistorialControles(pacienteId, historialControles)
    } catch (e) {
      log.error('Error al guardar historial:', e)
    }
  }, [historialControles, pacienteId])

  const controlActivo = useMemo(() => {
    return historialControles.find(c => c.id === controlActivoId) || historialControles[0]
  }, [historialControles, controlActivoId])

  const datosPeriodontales = useMemo(() => controlActivo?.piezas || {}, [controlActivo])

  const metricas = useMemo(() => {
    return calcularEstadisticasPeriodontales(datosPeriodontales)
  }, [datosPeriodontales])

  const resumenClinico = useMemo(() => {
    return generarResumenClinico(metricas, datosPeriodontales)
  }, [metricas, datosPeriodontales])

  const datosGrafico = useMemo(() => {
    return estructurarDatosParaGrafico(datosPeriodontales)
  }, [datosPeriodontales])

  const actualizarPieza = useCallback((piezaId, callbackMutacion) => {
    setHistorialControles(prevHistorial => {
      return prevHistorial.map(ctrl => {
        if (ctrl.id !== controlActivoId) return ctrl
        
        const piezasActuales = ctrl.piezas || {}
        const piezaPrev = piezasActuales[piezaId] || crearPiezaVaciaSchema()
        const piezaActualizada = callbackMutacion(piezaPrev)

        return {
          ...ctrl,
          piezas: { ...piezasActuales, [piezaId]: piezaActualizada }
        }
      })
    })
  }, [controlActivoId])

  const actualizarSondaje = useCallback((piezaId, sitioId, valorRaw) => {
    actualizarPieza(piezaId, (pieza) => ({
      ...pieza,
      sondaje: { ...pieza.sondaje, [sitioId]: sanitizarSondaje(valorRaw) }
    }))
  }, [actualizarPieza])

  const actualizarRecesion = useCallback((piezaId, sitioId, valorRaw) => {
    actualizarPieza(piezaId, (pieza) => ({
      ...pieza,
      recesion: { ...pieza.recesion, [sitioId]: sanitizarRecesion(valorRaw) }
    }))
  }, [actualizarPieza])

  const toggleFlagSitio = useCallback((piezaId, campoFlag, sitioId) => {
    actualizarPieza(piezaId, (pieza) => {
      const mapaActual = pieza[campoFlag] || {}
      return {
        ...pieza,
        [campoFlag]: { ...mapaActual, [sitioId]: !mapaActual[sitioId] }
      }
    })
  }, [actualizarPieza])

  const actualizarAtributoGlobalPieza = useCallback((piezaId, campo, valor) => {
    actualizarPieza(piezaId, (pieza) => ({ ...pieza, [campo]: valor }))
  }, [actualizarPieza])

  const togglePiezaAusente = useCallback((piezaId) => {
    actualizarPieza(piezaId, (pieza) => ({ ...pieza, ausente: !pieza.ausente }))
  }, [actualizarPieza])

  const togglePiezaImplante = useCallback((piezaId) => {
    actualizarPieza(piezaId, (pieza) => ({ ...pieza, implante: !pieza.implante }))
  }, [actualizarPieza])

  const crearNuevoControl = useCallback((observacion) => {
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