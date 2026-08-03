/**
 * Cálculos para Odontopediatría
 */

import { CARAS_OLEARY } from '../constants/pediatriaConstants'

/**
 * Calcula el Índice de Placa de O'Leary
 * % = (Caras con placa / Total de caras presentes evaluadas) * 100
 */
export const calcularPorcentajeOLeary = (mapaPlaca = {}, totalPiezasPresentes = 20) => {
  const totalCarasPosibles = totalPiezasPresentes * 4
  if (totalCarasPosibles === 0) return 0

  let carasConPlaca = 0

  Object.values(mapaPlaca).forEach(pieza => {
    if (!pieza) return
    CARAS_OLEARY.forEach(cara => {
      if (pieza[cara] === true) {
        carasConPlaca++
      }
    })
  })

  return Math.round((carasConPlaca / totalCarasPosibles) * 100)
}