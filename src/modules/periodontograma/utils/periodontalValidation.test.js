import { describe, it, expect } from 'vitest'
import {
  sanitizarSondaje,
  sanitizarRecesion,
  esSacoPeriodontal,
  esDienteMultirradicular,
  esMovilidadValida,
  esFurcaValida
} from './periodontalValidation'

describe('periodontalValidation', () => {
  describe('sanitizarSondaje', () => {
    it('retorna string vacio para valores vacios o nulos', () => {
      expect(sanitizarSondaje('')).toBe('')
      expect(sanitizarSondaje(null)).toBe('')
      expect(sanitizarSondaje(undefined)).toBe('')
      expect(sanitizarSondaje('abc')).toBe('')
    })

    it('restringe valores dentro de los limites (0 a 12)', () => {
      expect(sanitizarSondaje(5)).toBe(5)
      expect(sanitizarSondaje('7')).toBe(7)
      expect(sanitizarSondaje(-2)).toBe(0)
      expect(sanitizarSondaje(20)).toBe(12)
    })
  })

  describe('sanitizarRecesion', () => {
    it('retorna string vacio para valores no numericos', () => {
      expect(sanitizarRecesion('')).toBe('')
      expect(sanitizarRecesion(null)).toBe('')
      expect(sanitizarRecesion('xyz')).toBe('')
    })

    it('permite valores negativos y positivos dentro de limites (-5 a 12)', () => {
      expect(sanitizarRecesion(-2)).toBe(-2)
      expect(sanitizarRecesion(4)).toBe(4)
      expect(sanitizarRecesion(-10)).toBe(-5)
      expect(sanitizarRecesion(18)).toBe(12)
    })
  })

  describe('esSacoPeriodontal', () => {
    it('retorna true si la profundidad es >= 4 (umbral moderado)', () => {
      expect(esSacoPeriodontal(4)).toBe(true)
      expect(esSacoPeriodontal(6)).toBe(true)
    })

    it('retorna false si es menor a 4 o invalido', () => {
      expect(esSacoPeriodontal(3)).toBe(false)
      expect(esSacoPeriodontal(0)).toBe(false)
      expect(esSacoPeriodontal('')).toBe(false)
      expect(esSacoPeriodontal(null)).toBe(false)
    })
  })

  describe('esDienteMultirradicular', () => {
    it('identifica molares superiores e inferiores como multirradiculares', () => {
      expect(esDienteMultirradicular('1.6')).toBe(true)
      expect(esDienteMultirradicular('4.6')).toBe(true)
      expect(esDienteMultirradicular('2.6')).toBe(true)
    })

    it('identifica incisivos y caninos como no multirradiculares', () => {
      expect(esDienteMultirradicular('1.1')).toBe(false)
      expect(esDienteMultirradicular('3.3')).toBe(false)
    })
  })

  describe('esMovilidadValida y esFurcaValida', () => {
    it('valida opciones de movilidad', () => {
      expect(esMovilidadValida('0')).toBe(true)
      expect(esMovilidadValida('1')).toBe(true)
      expect(esMovilidadValida('3')).toBe(true)
      expect(esMovilidadValida('4')).toBe(false)
    })

    it('valida opciones de furca', () => {
      expect(esFurcaValida('0')).toBe(true)
      expect(esFurcaValida('1')).toBe(true)
      expect(esFurcaValida('2')).toBe(true)
      expect(esFurcaValida('3')).toBe(true)
      expect(esFurcaValida('4')).toBe(false)
    })
  })
})
