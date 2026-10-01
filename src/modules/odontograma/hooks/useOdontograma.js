import { useState, useMemo, useCallback, useEffect } from 'react'
import { calcularIndiceCPOD } from '../utils/odontogramaCalculations'

export const useOdontograma = (odontogramaInicial = {}, guardarCallback = () => {}) => {
  const [odontograma, setOdontograma] = useState(odontogramaInicial)
  const [tipoDenticion, setTipoDenticion] = useState('permanente')
  const [modoSeleccionado, setModoSeleccionado] = useState('caries')
  const [piezaActiva, setPiezaActiva] = useState('1.8')
  const [modoComparativoSplit, setModoComparativoSplit] = useState(false)

  // F6-D-2: comparar contenido en lugar de referencia para evitar
  // actualizaciones innecesarias que disparan el warning de React:
  // "Cannot update a component while rendering a different component"
  useEffect(() => {
    if (odontogramaInicial) {
      // Solo actualizar si el contenido realmente cambió
      const contenidoActual = JSON.stringify(odontograma)
      const contenidoNuevo = JSON.stringify(odontogramaInicial)
      if (contenidoActual !== contenidoNuevo) {
        setOdontograma(odontogramaInicial)
      }
    }
  }, [odontogramaInicial])

  // F6-D-2: persistir cambios DESPUÉS del render (evita warning de React)
  // Este efecto se dispara cuando odontograma cambia por interacción del usuario
  useEffect(() => {
    // Solo persistir si hay cambios reales (no en el render inicial)
    if (odontograma && Object.keys(odontograma).length > 0) {
      guardarCallback(odontograma)
    }
  }, [odontograma, guardarCallback])

  const cpodStats = useMemo(() => calcularIndiceCPOD(odontograma), [odontograma])

  const handleCaraClick = useCallback((numeroPieza, cara, modo) => {
    setPiezaActiva(numeroPieza)
    setOdontograma(prev => {
      const piezaPrev = prev[numeroPieza] || { general: 'sano', caras: {}, observacion: '' }
      const estadoActualCara = piezaPrev.caras?.[cara]
      const nuevoEstadoCara = estadoActualCara === modo ? 'sano' : modo

      return {
        ...prev,
        [numeroPieza]: {
          ...piezaPrev,
          general: 'sano',
          caras: { ...piezaPrev.caras, [cara]: nuevoEstadoCara }
        }
      }
    })
    // F6-D-2: guardarCallback se llama desde useEffect cuando odontograma cambia
  }, [])

  const handleEstadoGeneral = useCallback((modo) => {
    if (!piezaActiva) return
    setOdontograma(prev => ({
      ...prev,
      [piezaActiva]: { ...(prev[piezaActiva] || {}), general: modo, caras: {} }
    }))
    // F6-D-2: guardarCallback se llama desde useEffect cuando odontograma cambia
  }, [piezaActiva])

  const handleLimpiarPieza = useCallback(() => {
    if (!piezaActiva) return
    setOdontograma(prev => ({
      ...prev,
      [piezaActiva]: { general: 'sano', caras: {}, observacion: '' }
    }))
    // F6-D-2: guardarCallback se llama desde useEffect cuando odontograma cambia
  }, [piezaActiva])

  const handleObservacionChange = useCallback((texto) => {
    if (!piezaActiva) return
    setOdontograma(prev => ({
      ...prev,
      [piezaActiva]: { ...(prev[piezaActiva] || { general: 'sano', caras: {} }), observacion: texto }
    }))
    // F6-D-2: guardarCallback se llama desde useEffect cuando odontograma cambia
  }, [piezaActiva])

  return {
    odontograma,
    tipoDenticion,
    setTipoDenticion,
    modoSeleccionado,
    setModoSeleccionado,
    piezaActiva,
    setPiezaActiva,
    modoComparativoSplit,
    setModoComparativoSplit,
    cpodStats,
    handleCaraClick,
    handleEstadoGeneral,
    handleLimpiarPieza,
    handleObservacionChange
  }
}