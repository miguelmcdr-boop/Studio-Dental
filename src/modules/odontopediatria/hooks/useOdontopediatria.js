import { useState, useEffect, useMemo, useCallback } from 'react'
import { calcularPorcentajeOLeary } from '../utils/pediatriaCalculations'

export const useOdontopediatria = (pacienteId) => {
  const STORAGE_KEY = `pediatria_${pacienteId}`

  const [datosPediatria, setDatosPediatria] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {
        gradoFrankl: 3,
        observacionConducta: '',
        mapaOleary: {},
        piezasPresentesOleary: 20,
        habitosNocivos: { chupete: false, succionDigital: false, deglucionAtipica: false, respiradorBucal: false },
        dentosanaRegistrada: false,
        mapaDentosana: {}
      }
    } catch (e) {
      return { gradoFrankl: 3, observacionConducta: '', mapaOleary: {}, piezasPresentesOleary: 20 }
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datosPediatria))
  }, [datosPediatria, STORAGE_KEY])

  const porcentajeOLeary = useMemo(() => {
    return calcularPorcentajeOLeary(datosPediatria.mapaOleary, datosPediatria.piezasPresentesOleary)
  }, [datosPediatria.mapaOleary, datosPediatria.piezasPresentesOleary])

  const cambiarFrankl = useCallback((grado) => {
    setDatosPediatria(prev => ({ ...prev, gradoFrankl: grado }))
  }, [])

  const toggleCaraOleary = useCallback((piezaId, cara) => {
    setDatosPediatria(prev => {
      const mapaPrev = prev.mapaOleary || {}
      const piezaPrev = mapaPrev[piezaId] || {}
      return {
        ...prev,
        mapaOleary: {
          ...mapaPrev,
          [piezaId]: {
            ...piezaPrev,
            [cara]: !piezaPrev[cara]
          }
        }
      }
    })
  }, [])

  const toggleEstadoPiezaDentosana = useCallback((piezaId, estado) => {
    setDatosPediatria(prev => ({
      ...prev,
      mapaDentosana: { ...prev.mapaDentosana, [piezaId]: estado }
    }))
  }, [])

  const actualizarAtributo = useCallback((campo, valor) => {
    setDatosPediatria(prev => ({ ...prev, [campo]: valor }))
  }, [])

  return {
    datosPediatria,
    porcentajeOLeary,
    cambiarFrankl,
    toggleCaraOleary,
    actualizarAtributo,
    toggleEstadoPiezaDentosana
  }
}