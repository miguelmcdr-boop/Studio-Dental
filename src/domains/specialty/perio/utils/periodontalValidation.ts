/**
 * Módulo de Validaciones Clínicas y Sanitización
 */

import { LIMITES_SONDAJE, OPCIONES_MOVILIDAD, OPCIONES_FURCA, DIENTES_MULTIRRADICULARES } from '../constants/periodontalConstants'

export const sanitizarSondaje = (valor: unknown): number | '' => {
  if (valor === '' || valor === null || valor === undefined) return ''
  const num = parseInt(String(valor), 10)
  if (isNaN(num)) return ''
  return Math.max(LIMITES_SONDAJE.MIN, Math.min(LIMITES_SONDAJE.MAX, num))
}

export const sanitizarRecesion = (valor: unknown): number | '' => {
  if (valor === '' || valor === null || valor === undefined) return ''
  const num = parseInt(String(valor), 10)
  if (isNaN(num)) return ''
  return Math.max(-5, Math.min(12, num)) // Acepta valores negativos (hiperplasia)
}

export const esSacoPeriodontal = (profundidad: unknown): boolean => {
  if (profundidad === '' || profundidad === null || profundidad === undefined) return false
  const num = Number(profundidad)
  if (isNaN(num)) return false
  return num >= LIMITES_SONDAJE.UMBRAL_SACO_MODERADO
}

export const esDienteMultirradicular = (piezaId: unknown): boolean =>
  DIENTES_MULTIRRADICULARES.includes(String(piezaId))

export const esMovilidadValida = (grado: unknown): boolean =>
  (OPCIONES_MOVILIDAD as readonly string[]).includes(String(grado))

export const esFurcaValida = (grado: unknown): boolean =>
  (OPCIONES_FURCA as readonly string[]).includes(String(grado))
