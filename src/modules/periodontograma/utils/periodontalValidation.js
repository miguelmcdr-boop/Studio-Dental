/**
 * Módulo de Validaciones Clínicas y Sanitización
 */

import { LIMITES_SONDAJE, OPCIONES_MOVILIDAD, OPCIONES_FURCA, DIENTES_MULTIRRADICULARES } from '../constants/periodontalConstants'

export const sanitizarSondaje = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return ''
  const num = parseInt(valor, 10)
  if (isNaN(num)) return ''
  return Math.max(LIMITES_SONDAJE.MIN, Math.min(LIMITES_SONDAJE.MAX, num))
}

export const sanitizarRecesion = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return ''
  const num = parseInt(valor, 10)
  if (isNaN(num)) return ''
  return Math.max(-5, Math.min(12, num)) // Acepta valores negativos (hiperplasia)
}

export const esSacoPeriodontal = (profundidad) => {
  if (profundidad === '' || profundidad === null || profundidad === undefined) return false
  return profundidad >= LIMITES_SONDAJE.UMBRAL_SACO_MODERADO
}

export const esDienteMultirradicular = (piezaId) => DIENTES_MULTIRRADICULARES.includes(String(piezaId))
export const esMovilidadValida = (grado) => OPCIONES_MOVILIDAD.includes(String(grado))
export const esFurcaValida = (grado) => OPCIONES_FURCA.includes(String(grado))