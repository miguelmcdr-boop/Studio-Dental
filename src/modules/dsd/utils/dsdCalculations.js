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
 * Genera el análisis de visibilidad frontal basado en la Proporción Dorada.
 *
 * REGLA DE SEGURIDAD CLÍNICA (Constitución, Cap. V.2 — "Fail-Safe Clinical
 * Default"): si el ancho del incisivo central no fue medido, la función NO
 * debe asumir un promedio poblacional (8.5mm) ni derivar de él estimaciones
 * de piezas vecinas presentadas como si fueran cálculos reales del paciente.
 * Retorna un estado explícito para que la UI indique "No definido" en vez
 * de una medida fabricada.
 */
export const calcularVisibilidadDorada = (anchoCentral) => {
  const central = parseFloat(anchoCentral)

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