import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  calcularRatioAnchoAlto,
  calcularVisibilidadDorada,
  type VisibilidadDoradaResultado
} from '../utils/dsdCalculations'
import {
  dsdStorageService,
  type DsdConfig
} from '../services/dsdStorageService'

export interface DsdConfigCompleta {
  anchoCentral: number
  altoCentral: number
  tonoActual: string
  tonoDeseado: string
  formaDeseada: string
  lineaSonrisa: string
  observacionEstetica: string
  [key: string]: unknown
}

export const DSD_DEFAULT: DsdConfigCompleta = {
  anchoCentral: 8.5,
  altoCentral: 10.5,
  tonoActual: 'A2',
  tonoDeseado: 'BL2',
  formaDeseada: 'ovoidal',
  lineaSonrisa: 'Media (Muestra 100% de corona clínica)',
  observacionEstetica: ''
}

export interface UseSmileDesignReturn {
  dsdData: DsdConfigCompleta
  ratioAnchoAlto: number
  visibilidadDorada: VisibilidadDoradaResultado
  esProporcionIdeal: boolean
  actualizarAtributoDsd: (campo: string, valor: unknown) => void
}

export const useSmileDesign = (
  pacienteId: string | number | null | undefined
): UseSmileDesignReturn => {
  const [dsdData, setDsdData] = useState<DsdConfigCompleta>(() => {
    try {
      const guardado = dsdStorageService.obtenerConfigDePaciente<DsdConfig>(
        pacienteId,
        DSD_DEFAULT
      )
      return { ...DSD_DEFAULT, ...guardado } as DsdConfigCompleta
    } catch {
      return DSD_DEFAULT
    }
  })

  useEffect(() => {
    dsdStorageService.guardarConfigDePaciente(pacienteId, dsdData)
  }, [dsdData, pacienteId])

  const ratioAnchoAlto = useMemo(() => {
    return calcularRatioAnchoAlto(dsdData.anchoCentral, dsdData.altoCentral)
  }, [dsdData.anchoCentral, dsdData.altoCentral])

  const visibilidadDorada = useMemo(() => {
    return calcularVisibilidadDorada(dsdData.anchoCentral)
  }, [dsdData.anchoCentral])

  const esProporcionIdeal = ratioAnchoAlto >= 0.75 && ratioAnchoAlto <= 0.85

  const actualizarAtributoDsd = useCallback((campo: string, valor: unknown) => {
    setDsdData(prev => ({ ...prev, [campo]: valor }))
  }, [])

  return {
    dsdData,
    ratioAnchoAlto,
    visibilidadDorada,
    esProporcionIdeal,
    actualizarAtributoDsd
  }
}
