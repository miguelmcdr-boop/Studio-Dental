/**
 * Calculadora de dosis de anestesia local (F4-03d).
 *
 * Este archivo actúa como re-export delgado (wrapper) del módulo
 * `anestesiaCalculations.js` que contiene la implementación completa.
 * Esta arquitectura preserva compatibilidad con imports existentes
 * (CalculadoraAnestesiaSection.jsx, tests de F1-03) mientras respeta
 * los límites arquitectónicos de Constitución Cap. III.
 *
 * APIs públicas (re-exportadas desde anestesiaCalculations.js):
 * - calcularTubosAnestesia(peso, tipoAnestesico) → API legada F1-03
 * - calcularDosisAnestesiaCompleta(params) → API enriquecida F4-03d
 * - listarAnestesicosDisponibles() → utilidad para selectores UI
 */
export {
  calcularTubosAnestesia,
  calcularDosisAnestesiaCompleta,
  listarAnestesicosDisponibles,
  normalizar,
  DOSIS_RESPALDO_V10
} from './anestesiaCalculations'
