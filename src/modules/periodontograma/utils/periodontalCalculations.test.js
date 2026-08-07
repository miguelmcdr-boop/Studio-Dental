import { describe, it, expect } from 'vitest'
import {
  calcularCAL,
  calcularClasificacionAAP,
  calcularIndicesPeriodontales,
} from './periodontalCalculations'

describe('calcularCAL', () => {
  it('suma profundidad de sondaje y recesión cuando ambos son válidos', () => {
    expect(calcularCAL(4, 2)).toBe(6)
  })

  it('trata la recesión ausente/inválida como 0, no como dato faltante', () => {
    expect(calcularCAL(4, undefined)).toBe(4)
    expect(calcularCAL('4', '')).toBe(4)
  })

  it('retorna cadena vacía si el sondaje no es un número (dato crítico faltante)', () => {
    expect(calcularCAL(undefined, 2)).toBe('')
    expect(calcularCAL('', 2)).toBe('')
    expect(calcularCAL('abc', 2)).toBe('')
  })
})

describe('calcularClasificacionAAP', () => {
  it('clasifica como Salud Periodontal cuando no hay sondaje profundo ni sangrado relevante', () => {
    const r = calcularClasificacionAAP(2, 5, { fumador: false, diabetes: false })
    expect(r.etapa).toBe('Salud Periodontal')
    expect(r.grado).toBe('Grado A (Bajo Riesgo)')
  })

  it('clasifica Gingivitis cuando el sangrado supera 10% sin bolsas profundas', () => {
    const r = calcularClasificacionAAP(3, 15)
    expect(r.etapa).toBe('Gingivitis Inducida por Placa Bacteriana')
  })

  it.each([
    [4, 'Periodontitis Inicial (Etapa I)'],
    [5, 'Periodontitis Moderada (Etapa II)'],
    [6, 'Periodontitis Severa / Avanzada (Etapa III / IV)'],
    [9, 'Periodontitis Severa / Avanzada (Etapa III / IV)'],
  ])('con maxSondaje=%i clasifica etapa como "%s"', (sondaje, etapaEsperada) => {
    expect(calcularClasificacionAAP(sondaje, 0).etapa).toBe(etapaEsperada)
  })

  it('fumador o diabetes eleva el grado a C independiente del sangrado/sondaje', () => {
    const r = calcularClasificacionAAP(2, 0, { fumador: true, diabetes: false })
    expect(r.grado).toBe('Grado C (Riesgo Elevado de Progresión Rápida)')
  })

  it('sangrado >30% o sondaje >=5 sin factores de riesgo eleva a grado B', () => {
    expect(calcularClasificacionAAP(2, 35).grado).toBe('Grado B (Riesgo Moderado de Progresión)')
    expect(calcularClasificacionAAP(5, 0).grado).toBe('Grado B (Riesgo Moderado de Progresión)')
  })

  it('usa valores por defecto seguros (0) cuando no se informan parámetros', () => {
    const r = calcularClasificacionAAP()
    expect(r.etapa).toBe('Salud Periodontal')
    expect(r.grado).toBe('Grado A (Bajo Riesgo)')
  })
})

describe('calcularIndicesPeriodontales', () => {
  it('retorna todo en cero para piezasData vacío o indefinido', () => {
    const r = calcularIndicesPeriodontales({})
    expect(r.sitiosTotales).toBe(0)
    expect(r.porcentajeSangrado).toBe(0)
    expect(r.indiceOLeary).toBe(0)
    expect(r.maxSondaje).toBe(0)
    expect(calcularIndicesPeriodontales(undefined).sitiosTotales).toBe(0)
  })

  it('excluye piezas marcadas como ausentes del conteo de sitios', () => {
    const piezasData = {
      11: { ausente: true, vestibular: { sondaje: [5, 5, 5] } },
    }
    expect(calcularIndicesPeriodontales(piezasData).sitiosTotales).toBe(0)
  })

  it('cuenta 3 sitios por cara evaluada (vestibular + palatino) y calcula porcentajes', () => {
    const piezasData = {
      11: {
        vestibular: { sondaje: [3, 3, 3], sangrado: [true, false, false], placa: [true, true, false] },
        palatino: { sondaje: [2, 2, 2], sangrado: [false, false, false], placa: [false, false, false] },
      },
    }
    const r = calcularIndicesPeriodontales(piezasData)
    expect(r.sitiosTotales).toBe(6)
    expect(r.sitiosSangrado).toBe(1)
    expect(r.sitiosPlaca).toBe(2)
    expect(r.maxSondaje).toBe(3)
    expect(r.porcentajeSangrado).toBe(Math.round((1 / 6) * 100))
    expect(r.indiceOLeary).toBe(Math.round((2 / 6) * 100))
  })

  it('trata profundidades de sondaje inválidas como 0 en vez de romper el cálculo', () => {
    const piezasData = {
      11: {
        vestibular: { sondaje: ['x', null, undefined], sangrado: [false, false, false], placa: [false, false, false] },
      },
    }
    const r = calcularIndicesPeriodontales(piezasData)
    expect(r.maxSondaje).toBe(0)
    expect(r.sitiosTotales).toBe(3)
  })

  it('deriva diagnosticoSugerido y gradoAAP a partir de los índices calculados', () => {
    const piezasData = {
      11: {
        vestibular: { sondaje: [6, 6, 6], sangrado: [true, true, true], placa: [true, true, true] },
      },
    }
    const r = calcularIndicesPeriodontales(piezasData)
    expect(r.diagnosticoSugerido).toBe('Periodontitis Severa / Avanzada (Etapa III / IV)')
  })
})