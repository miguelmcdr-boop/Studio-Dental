import { useState, useEffect, useMemo, useCallback } from 'react'
import { calcularPorcentajeOLeary } from '../utils/pediatriaCalculations'
import {
  odontopediatriaStorageService,
  type DatosPediatria,
  type HabitosNocivos
} from '../services/odontopediatriaStorageService'

export interface HabitosNocivosCompletos {
  chupete: boolean
  succionDigital: boolean
  deglucionAtipica: boolean
  respiradorBucal: boolean
}

export interface DatosPediatriaCompletos {
  gradoFrankl: number
  observacionConducta: string
  mapaOleary: Record<string, Record<string, boolean>>
  piezasPresentesOleary: number
  habitosNocivos: HabitosNocivosCompletos
  dentosanaRegistrada: boolean
  mapaDentosana: Record<string, unknown>
  [key: string]: unknown
}

export const DATOS_PEDIATRIA_DEFAULT: DatosPediatriaCompletos = {
  gradoFrankl: 3,
  observacionConducta: '',
  mapaOleary: {},
  piezasPresentesOleary: 20,
  habitosNocivos: {
    chupete: false,
    succionDigital: false,
    deglucionAtipica: false,
    respiradorBucal: false
  },
  dentosanaRegistrada: false,
  mapaDentosana: {}
}

export interface UseOdontopediatriaReturn {
  datosPediatria: DatosPediatriaCompletos
  porcentajeOLeary: number
  cambiarFrankl: (grado: number) => void
  toggleCaraOleary: (piezaId: string | number, cara: string) => void
  actualizarAtributo: (campo: string, valor: unknown) => void
  toggleEstadoPiezaDentosana: (piezaId: string | number, estado: unknown) => void
}

export const useOdontopediatria = (
  pacienteId: string | number | null | undefined
): UseOdontopediatriaReturn => {
  const [datosPediatria, setDatosPediatria] = useState<DatosPediatriaCompletos>(() => {
    try {
      const guardados = odontopediatriaStorageService.obtenerDatosDePaciente<DatosPediatria>(
        pacienteId,
        DATOS_PEDIATRIA_DEFAULT
      )
      return {
        ...DATOS_PEDIATRIA_DEFAULT,
        ...guardados,
        habitosNocivos: {
          ...DATOS_PEDIATRIA_DEFAULT.habitosNocivos,
          ...(guardados?.habitosNocivos as HabitosNocivos)
        }
      } as DatosPediatriaCompletos
    } catch {
      return DATOS_PEDIATRIA_DEFAULT
    }
  })

  useEffect(() => {
    odontopediatriaStorageService.guardarDatosDePaciente(pacienteId, datosPediatria)
  }, [datosPediatria, pacienteId])

  const porcentajeOLeary = useMemo(() => {
    return calcularPorcentajeOLeary(
      datosPediatria.mapaOleary,
      datosPediatria.piezasPresentesOleary
    )
  }, [datosPediatria.mapaOleary, datosPediatria.piezasPresentesOleary])

  const cambiarFrankl = useCallback((grado: number) => {
    setDatosPediatria(prev => ({ ...prev, gradoFrankl: grado }))
  }, [])

  const toggleCaraOleary = useCallback((piezaId: string | number, cara: string) => {
    setDatosPediatria(prev => {
      const mapaPrev = prev.mapaOleary || {}
      const idStr = String(piezaId)
      const piezaPrev = mapaPrev[idStr] || {}
      return {
        ...prev,
        mapaOleary: {
          ...mapaPrev,
          [idStr]: {
            ...piezaPrev,
            [cara]: !piezaPrev[cara]
          }
        }
      }
    })
  }, [])

  const toggleEstadoPiezaDentosana = useCallback(
    (piezaId: string | number, estado: unknown) => {
      setDatosPediatria(prev => ({
        ...prev,
        mapaDentosana: { ...prev.mapaDentosana, [String(piezaId)]: estado }
      }))
    },
    []
  )

  const actualizarAtributo = useCallback((campo: string, valor: unknown) => {
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
