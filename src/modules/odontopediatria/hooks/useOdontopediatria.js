import { useState, useEffect, useMemo, useCallback } from 'react'
import { calcularPorcentajeOLeary } from '../utils/pediatriaCalculations'
// F2-07b: acceso centralizado vía servicio
import { odontopediatriaStorageService } from '../services/odontopediatriaStorageService'

// F2-07b: default extraído a constante para claridad
const DATOS_PEDIATRIA_DEFAULT = {
  gradoFrankl: 3,
  observacionConducta: '',
  mapaOleary: {},
  piezasPresentesOleary: 20,
  habitosNocivos: { chupete: false, succionDigital: false, deglucionAtipica: false, respiradorBucal: false },
  dentosanaRegistrada: false,
  mapaDentosana: {}
}

export const useOdontopediatria = (pacienteId) => {
  const [datosPediatria, setDatosPediatria] = useState(() => {
    try {
      // F2-07b: cargar vía servicio con default estructurado
      return odontopediatriaStorageService.obtenerDatosDePaciente(
        pacienteId,
        DATOS_PEDIATRIA_DEFAULT
      )
    } catch {
      return DATOS_PEDIATRIA_DEFAULT
    }
  })

  // F2-07b: persistir vía servicio (antes localStorage directo)
  useEffect(() => {
    odontopediatriaStorageService.guardarDatosDePaciente(pacienteId, datosPediatria)
  }, [datosPediatria, pacienteId])

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