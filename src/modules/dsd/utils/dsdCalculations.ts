/**
 * Motor de Cálculos Estéticos para DSD
 */

import { PROPORCION_DORADA_TEORICA } from '../constants/dsdConstants'

export interface VisibilidadDoradaResultado {
  estado: 'DATOS_INCOMPLETOS' | 'OK'
  centralVisible: number | null
  lateralEstimado: number | null
  caninoEstimado: number | null
}

export const calcularRatioAnchoAlto = (ancho: unknown, alto: unknown): number => {
  const a = parseFloat(String(ancho)) || 0
  const h = parseFloat(String(alto)) || 0
  if (h <= 0) return 0
  return parseFloat((a / h).toFixed(2))
}

export const calcularVisibilidadDorada = (anchoCentral: unknown): VisibilidadDoradaResultado => {
  const central = parseFloat(String(anchoCentral))

  if (!Number.isFinite(central) || central <= 0) {
    return {
      estado: 'DATOS_INCOMPLETOS',
      centralVisible: null,
      lateralEstimado: null,
      caninoEstimado: null
    }
  }

  const lateralEstimado = parseFloat((central / PROPORCION_DORADA_TEORICA.visibilidadCentral).toFixed(2))
  const caninoEstimado = parseFloat((lateralEstimado * PROPORCION_DORADA_TEORICA.visibilidadCanino).toFixed(2))

  return {
    estado: 'OK',
    centralVisible: central,
    lateralEstimado,
    caninoEstimado
  }
}
