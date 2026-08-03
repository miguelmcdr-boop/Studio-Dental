import { useState, useEffect, useMemo, useCallback } from 'react'
import { crearPiezaVaciaSchema, crearControlPeriodontalSchema } from '../schemas/periodontalSchema'
import { sanitizarSondaje, sanitizarRecesion } from '../utils/periodontalValidation'
import { calcularEstadisticasPeriodontales, generarResumenClinico, estructurarDatosParaGrafico } from '../utils/periodontalCalculations'

export const usePeriodontograma = (pacienteId) => {
  const STORAGE_KEY = `periodonto_historial_${pacienteId}`

  const [historialControles, setHistorialControles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : [crearControlPeriodontalSchema()]
      }
      return [crearControlPeriodontalSchema()]
    } catch (e) {
      return [crearControlPeriodontalSchema()]
    }
  })

  const [controlActivoId, setControlActivoId] = useState(() => historialControles[0]?.id)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historialControles))
    } catch (e) {
      console.error('Error al guardar historial:', e)
    }
  }, [historialControles, STORAGE_KEY])

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