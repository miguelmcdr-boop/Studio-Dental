import { describe, it, expect } from 'vitest'
import {
  esCardiopata,
  esPediatria,
  parseEdad
} from './anestesiaHelpers'

describe('anestesiaHelpers', () => {
  it('detecta cardiopatia a partir de texto clinico', () => {
    expect(esCardiopata('Hipertension arterial')).toBe(true)
    expect(esCardiopata('Paciente con arritmia')).toBe(true)
    expect(esCardiopata('Sin antecedentes morbidos')).toBe(false)
    expect(esCardiopata(null)).toBe(false)
  })

  it('determina si un paciente es pediatrico (<18 años)', () => {
    expect(esPediatria(10)).toBe(true)
    expect(esPediatria('15')).toBe(true)
    expect(esPediatria(18)).toBe(false)
    expect(esPediatria(45)).toBe(false)
    expect(esPediatria(null)).toBe(false)
  })

  it('parsea edad numerica retornando null para entradas no validas', () => {
    expect(parseEdad('25')).toBe(25)
    expect(parseEdad(30)).toBe(30)
    expect(parseEdad('')).toBeNull()
    expect(parseEdad(null)).toBeNull()
    expect(parseEdad('desconocido')).toBeNull()
  })
})
