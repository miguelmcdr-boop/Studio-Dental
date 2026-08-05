import { useState, useMemo, useCallback, useEffect } from 'react'
import { calcularIndiceCPOD } from '../utils/odontogramaCalculations'

export const useOdontograma = (odontogramaInicial = {}, guardarCallback = () => {}) => {
  const [odontograma, setOdontograma] = useState(odontogramaInicial)
  const [tipoDenticion, setTipoDenticion] = useState('permanente')
  const [modoSeleccionado, setModoSeleccionado] = useState('caries')
  const [piezaActiva, setPiezaActiva] = useState('1.8')
  const [modoComparativoSplit, setModoComparativoSplit] = useState(false)

  useEffect(() => {
    if (odontogramaInicial) {
      setOdontograma(odontogramaInicial)
    }
  }, [odontogramaInicial])

  const cpodStats = useMemo(() => calcularIndiceCPOD(odontograma), [odontograma])

  const handleCaraClick = useCallback((numeroPieza, cara, modo) => {
    setPiezaActiva(numeroPieza)
    setOdontograma(prev => {
      const piezaPrev = prev[numeroPieza] || { general: 'sano', caras: {}, observacion: '' }
      const estadoActualCara = piezaPrev.caras?.[cara]
      const nuevoEstadoCara = estadoActualCara === modo ? 'sano' : modo

      const nuevoState = {
        ...prev,
        [numeroPieza]: {
          ...piezaPrev,
          general: 'sano',
          caras: { ...piezaPrev.caras, [cara]: nuevoEstadoCara }
        }
      }
      guardarCallback(nuevoState)
      return nuevoState
    })
  }, [guardarCallback])

  const handleEstadoGeneral = useCallback((modo) => {
    if (!piezaActiva) return
    setOdontograma(prev => {
      const nuevoState = {
        ...prev,
        [piezaActiva]: { ...(prev[piezaActiva] || {}), general: modo, caras: {} }
      }
      guardarCallback(nuevoState)
      return nuevoState
    })
  }, [piezaActiva, guardarCallback])

  const handleLimpiarPieza = useCallback(() => {
    if (!piezaActiva) return
    setOdontograma(prev => {
      const nuevoState = {
        ...prev,
        [piezaActiva]: { general: 'sano', caras: {}, observacion: '' }
      }
      guardarCallback(nuevoState)
      return nuevoState
    })
  }, [piezaActiva, guardarCallback])

  const handleObservacionChange = useCallback((texto) => {
    if (!piezaActiva) return
    setOdontograma(prev => {
      const nuevoState = {
        ...prev,
        [piezaActiva]: { ...(prev[piezaActiva] || { general: 'sano', caras: {} }), observacion: texto }
      }
      guardarCallback(nuevoState)
      return nuevoState
    })
  }, [piezaActiva, guardarCallback])

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