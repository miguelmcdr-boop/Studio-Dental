import { describe, it, expect } from 'vitest'
import { normalizarRut, validarRut, formatearRut, obtenerErrorRut } from './validarRut'

describe('validarRut (F6-G)', () => {
  describe('normalizarRut', () => {
    it('quita puntos y guiones', () => {
      expect(normalizarRut('12.345.678-5')).toBe('123456785')
      expect(normalizarRut('12345678-5')).toBe('123456785')
      expect(normalizarRut('123456785')).toBe('123456785')
    })
    
    it('convierte K a mayúscula', () => {
      expect(normalizarRut('12.345.670-k')).toBe('12345670K')
      expect(normalizarRut('12345670-k')).toBe('12345670K')
    })
    
    it('maneja valores vacíos o inválidos', () => {
      expect(normalizarRut('')).toBe('')
      expect(normalizarRut(null)).toBe('')
      expect(normalizarRut(undefined)).toBe('')
      expect(normalizarRut(123)).toBe('')
    })
  })
  
  describe('validarRut', () => {
    it('valida RUTs válidos con dígito verificador numérico', () => {
      // RUTs calculados con algoritmo módulo 11
      expect(validarRut('12.345.678-5')).toBe(true)
      expect(validarRut('11.111.111-1')).toBe(true)
      expect(validarRut('7.654.321-6')).toBe(true)
      expect(validarRut('7654321-6')).toBe(true)
    })
    
    it('valida RUTs válidos con dígito verificador K', () => {
      expect(validarRut('12.345.670-K')).toBe(true)
      expect(validarRut('12345670-k')).toBe(true)
    })
    
    it('rechaza RUTs con dígito verificador incorrecto', () => {
      expect(validarRut('12.345.678-0')).toBe(false)
      expect(validarRut('12.345.678-9')).toBe(false)
      expect(validarRut('11.111.111-2')).toBe(false)
    })
    
    it('rechaza RUTs demasiado cortos', () => {
      expect(validarRut('1-9')).toBe(false) // Demasiado corto
      expect(validarRut('123-4')).toBe(false)
      expect(validarRut('1234')).toBe(false)
    })
    
    it('rechaza RUTs con formato inválido', () => {
      expect(validarRut('abcdefgh-i')).toBe(false)
      expect(validarRut('12.345.678-X')).toBe(false)
    })
  })
  
  describe('formatearRut', () => {
    it('formatea RUT con puntos y guión', () => {
      expect(formatearRut('123456785')).toBe('12.345.678-5')
      expect(formatearRut('76543216')).toBe('7.654.321-6')
    })
    
    it('formatea RUTs ya formateados (idempotente)', () => {
      expect(formatearRut('12.345.678-5')).toBe('12.345.678-5')
    })
    
    it('maneja RUTs cortos', () => {
      expect(formatearRut('1-9')).toBe('1-9')
    })
  })
  
  describe('obtenerErrorRut', () => {
    it('retorna null para RUTs válidos', () => {
      expect(obtenerErrorRut('12.345.678-5')).toBe(null)
      expect(obtenerErrorRut('11.111.111-1')).toBe(null)
      expect(obtenerErrorRut('12.345.670-K')).toBe(null)
    })
    
    it('retorna null para RUT vacío (es opcional)', () => {
      expect(obtenerErrorRut('')).toBe(null)
      expect(obtenerErrorRut(null)).toBe(null)
    })
    
    it('retorna error para RUTs demasiado cortos', () => {
      expect(obtenerErrorRut('1-9')).toBe('RUT demasiado corto')
      expect(obtenerErrorRut('123-4')).toBe('RUT demasiado corto')
    })
    
    it('retorna error para RUTs inválidos', () => {
      expect(obtenerErrorRut('12.345.678-0')).toBe('RUT inválido (verifique el dígito verificador)')
      expect(obtenerErrorRut('12.345.678-9')).toBe('RUT inválido (verifique el dígito verificador)')
    })
  })
})
