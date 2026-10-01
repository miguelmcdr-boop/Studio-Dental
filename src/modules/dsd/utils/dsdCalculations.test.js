/**
 * Tests — calcularVisibilidadDorada, calcularRatioAnchoAlto
 * Archivo: src/modules/dsd/utils/dsdCalculations.js
 * Tarea MASTER_ROADMAP: F1-04d
 *
 * Cubre la corrección del fail-safe clínico (Constitución, Cap. V.2):
 * ancho de incisivo central no informado ya no se asume en 8.5mm
 * (promedio poblacional) para derivar estimaciones de piezas vecinas
 * presentadas como cálculo real del paciente.
 */

import { describe, it, expect } from 'vitest'
import { calcularVisibilidadDorada, calcularRatioAnchoAlto } from './dsdCalculations'

describe('calcularVisibilidadDorada', () => {

  describe('ancho no informado (Fail-Safe Clinical Default)', () => {
    it('anchoCentral = undefined → estado DATOS_INCOMPLETOS, sin estimaciones fabricadas', () => {
      const r = calcularVisibilidadDorada(undefined)
      expect(r.estado).toBe('DATOS_INCOMPLETOS')
      expect(r.centralVisible).toBeNull()
      expect(r.lateralEstimado).toBeNull()
      expect(r.caninoEstimado).toBeNull()
    })

    it('anchoCentral = null → estado DATOS_INCOMPLETOS', () => {
      expect(calcularVisibilidadDorada(null).estado).toBe('DATOS_INCOMPLETOS')
    })

    it('anchoCentral = "" → estado DATOS_INCOMPLETOS', () => {
      expect(calcularVisibilidadDorada('').estado).toBe('DATOS_INCOMPLETOS')
    })

    it('anchoCentral = 0 o negativo → estado DATOS_INCOMPLETOS (no es una medida real posible)', () => {
      expect(calcularVisibilidadDorada(0).estado).toBe('DATOS_INCOMPLETOS')
      expect(calcularVisibilidadDorada(-3).estado).toBe('DATOS_INCOMPLETOS')
    })

    it('anchoCentral = "abc" (no numérico) → estado DATOS_INCOMPLETOS, sin lanzar excepción', () => {
      expect(() => calcularVisibilidadDorada('abc')).not.toThrow()
      expect(calcularVisibilidadDorada('abc').estado).toBe('DATOS_INCOMPLETOS')
    })
  })

  describe('ancho informado correctamente', () => {
    it('calcula lateral y canino estimados a partir de un ancho central válido, con estado OK', () => {
      const r = calcularVisibilidadDorada(8.5)
      expect(r.estado).toBe('OK')
      expect(r.centralVisible).toBe(8.5)
      expect(r.lateralEstimado).toBeGreaterThan(0)
      expect(r.caninoEstimado).toBeGreaterThan(0)
    })

    it('acepta el valor como string numérico', () => {
      expect(calcularVisibilidadDorada('9.2').estado).toBe('OK')
    })
  })
})

describe('calcularRatioAnchoAlto', () => {
  it('calcula el ratio correctamente con ambos valores válidos', () => {
    expect(calcularRatioAnchoAlto(8, 10)).toBe(0.8)
  })

  it('retorna 0 si alto es 0, ausente o inválido (valor obviamente no engañoso en este contexto)', () => {
    expect(calcularRatioAnchoAlto(8, 0)).toBe(0)
    expect(calcularRatioAnchoAlto(8, undefined)).toBe(0)
    expect(calcularRatioAnchoAlto(8, 'abc')).toBe(0)
  })
})