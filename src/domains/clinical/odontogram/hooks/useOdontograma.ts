import { useState, useMemo, useCallback, useEffect } from 'react'
import { calcularIndiceCPOD } from '../utils/odontogramaCalculations'

export interface PiezaOdontograma {
  general?: string
  caras?: Record<string, string>
  observacion?: string
  [key: string]: unknown
}

export type OdontogramaData = Record<string, PiezaOdontograma>

export interface CPODStats {
  cariados: number
  perdidos: number
  obturados: number
  sanos: number
  cpodTotal: number
  nivelRiesgoOMS: string
  colorBadge: string
}

export interface UseOdontogramaReturn {
  odontograma: OdontogramaData
  tipoDenticion: string
  setTipoDenticion: React.Dispatch<React.SetStateAction<string>>
  modoSeleccionado: string
  setModoSeleccionado: React.Dispatch<React.SetStateAction<string>>
  piezaActiva: string
  setPiezaActiva: React.Dispatch<React.SetStateAction<string>>
  modoComparativoSplit: boolean
  setModoComparativoSplit: React.Dispatch<React.SetStateAction<boolean>>
  cpodStats: CPODStats
  handleCaraClick: (numeroPieza: string, cara: string, modo: string) => void
  handleEstadoGeneral: (modo: string) => void
  handleLimpiarPieza: () => void
  handleObservacionChange: (texto: string) => void
}

export const useOdontograma = (
  odontogramaInicial: OdontogramaData = {},
  guardarCallback: (odonto: OdontogramaData) => void = () => {}
): UseOdontogramaReturn => {
  const [odontograma, setOdontograma] = useState<OdontogramaData>(odontogramaInicial)
  const [tipoDenticion, setTipoDenticion] = useState<string>('permanente')
  const [modoSeleccionado, setModoSeleccionado] = useState<string>('caries')
  const [piezaActiva, setPiezaActiva] = useState<string>('1.8')
  const [modoComparativoSplit, setModoComparativoSplit] = useState<boolean>(false)

  // F6-D-2: comparar contenido en lugar de referencia para evitar
  // actualizaciones innecesarias que disparan el warning de React:
  // "Cannot update a component while rendering a different component"
  useEffect(() => {
    if (odontogramaInicial) {
      setOdontograma(prev => {
        const contenidoActual = JSON.stringify(prev)
        const contenidoNuevo = JSON.stringify(odontogramaInicial)
        return contenidoActual !== contenidoNuevo ? odontogramaInicial : prev
      })
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

  const cpodStats: CPODStats = useMemo(
    () => (calcularIndiceCPOD(odontograma) as unknown as CPODStats),
    [odontograma]
  )

  const handleCaraClick = useCallback(
    (numeroPieza: string, cara: string, modo: string) => {
      setPiezaActiva(numeroPieza)
      setOdontograma(prev => {
        const piezaPrev = prev[numeroPieza] || {
          general: 'sano',
          caras: {},
          observacion: ''
        }
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
    },
    []
  )

  const handleEstadoGeneral = useCallback(
    (modo: string) => {
      if (!piezaActiva) return
      setOdontograma(prev => ({
        ...prev,
        [piezaActiva]: { ...(prev[piezaActiva] || {}), general: modo, caras: {} }
      }))
      // F6-D-2: guardarCallback se llama desde useEffect cuando odontograma cambia
    },
    [piezaActiva]
  )

  const handleLimpiarPieza = useCallback(() => {
    if (!piezaActiva) return
    setOdontograma(prev => ({
      ...prev,
      [piezaActiva]: { general: 'sano', caras: {}, observacion: '' }
    }))
    // F6-D-2: guardarCallback se llama desde useEffect cuando odontograma cambia
  }, [piezaActiva])

  const handleObservacionChange = useCallback(
    (texto: string) => {
      if (!piezaActiva) return
      setOdontograma(prev => ({
        ...prev,
        [piezaActiva]: {
          ...(prev[piezaActiva] || { general: 'sano', caras: {} }),
          observacion: texto
        }
      }))
      // F6-D-2: guardarCallback se llama desde useEffect cuando odontograma cambia
    },
    [piezaActiva]
  )

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
