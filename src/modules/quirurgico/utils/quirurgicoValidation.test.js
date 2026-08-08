/**
 * Tests — sanitizarTorque, sanitizarISQ
 * Archivo: src/modules/quirurgico/utils/quirurgicoValidation.js
 * Tarea MASTER_ROADMAP: F1-04c
 *
 * Cubre la corrección del fail-safe clínico (Constitución, Cap. V.2):
 * un valor no informado debe retornar `null`, nunca `0`. El torque de
 * inserción y el ISQ tienen significado diagnóstico real en 0 (inestabilidad
 * total del implante), que no debe confundirse con "no medido".
 */

import { describe, it, expect } from 'vitest'
import { sanitizarTorque, sanitizarISQ, esPiezaValida, sanitizarLongitudConducto } from './quirurgicoValidation'

describe.each([
  ['sanitizarTorque', sanitizarTorque],
  ['sanitizarISQ', sanitizarISQ],
])('%s', (_nombre, fn) => {

  describe('valor no informado (Fail-Safe Clinical Default)', () => {
    it('valor = "" (string vacío) → null, nunca 0', () => {
      expect(fn('')).toBeNull()
    })

    it('valor = null → null', () => {
      expect(fn(null)).toBeNull()
    })

    it('valor = undefined → null', () => {
      expect(fn(undefined)).toBeNull()
    })

    it('valor = "abc" (no numérico) → null, no lanza excepción', () => {
      expect(() => fn('abc')).not.toThrow()
      expect(fn('abc')).toBeNull()
    })
  })

  describe('valores válidos', () => {
    it('un 0 explícitamente ingresado se preserva como 0 real, no se confunde con "no medido"', () => {
      expect(fn(0)).toBe(0)
      expect(fn('0')).toBe(0)
    })

    it('un valor numérico normal se preserva tal cual', () => {
      expect(fn(35)).toBe(35)
      expect(fn('72')).toBe(72)
    })

    it('valores fuera de rango (0-100) se acotan (clamp), comportamiento sin cambios', () => {
      expect(fn(150)).toBe(100)
      expect(fn(-10)).toBe(0)
    })
  })
})

describe('esPiezaValida', () => {
  it('rechaza vacío, null, undefined y strings solo con espacios', () => {
    expect(esPiezaValida('')).toBe(false)
    expect(esPiezaValida(null)).toBe(false)
    expect(esPiezaValida(undefined)).toBe(false)
    expect(esPiezaValida('   ')).toBe(false)
  })

  it('acepta un identificador de pieza con contenido', () => {
    expect(esPiezaValida('1.6')).toBe(true)
  })
})

describe('sanitizarLongitudConducto', () => {
  it('retorna cadena vacía para valores falsy', () => {
    expect(sanitizarLongitudConducto('')).toBe('')
    expect(sanitizarLongitudConducto(null)).toBe('')
    expect(sanitizarLongitudConducto(undefined)).toBe('')
  })

  it('reemplaza coma decimal por punto y recorta espacios', () => {
    expect(sanitizarLongitudConducto(' 21,5 ')).toBe('21.5')
  })
})