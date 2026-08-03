/**
 * Motor de Cálculos Estéticos para DSD
 */

import { PROPORCION_DORADA_TEORICA } from '../constants/dsdConstants'

/**
 * Calcula el ratio Ancho/Alto para Incisivo Central
 */
export const calcularRatioAnchoAlto = (ancho, alto) => {
  const a = parseFloat(ancho) || 0
  const h = parseFloat(alto) || 0
  if (h <= 0) return 0
  return parseFloat((a / h).toFixed(2))
}

/**
 * Genera el análisis de visibilidad frontal basado en la Proporción Dorada
 */
export const calcularVisibilidadDorada = (anchoCentral) => {
  const central = parseFloat(anchoCentral) || 8.5
  const lateralEstimado = parseFloat((central / PROPORCION_DORADA_TEORICA.visibilidadCentral).toFixed(2))
  const caninoEstimado = parseFloat((lateralEstimado * PROPORCION_DORADA_TEORICA.visibilidadCanino).toFixed(2))

  return {
    centralVisible: central,
    lateralEstimado,
    caninoEstimado
  }
}