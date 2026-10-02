import { describe, it, expect } from 'vitest'
import {
  GUIA_TONOS_VITA,
  FORMAS_DENTARIAS,
  PROPORCION_DORADA_TEORICA
} from './dsdConstants'

describe('dsdConstants', () => {
  it('contiene guia de tonos vita con id, nombre y hex', () => {
    expect(GUIA_TONOS_VITA.length).toBeGreaterThan(0)
    GUIA_TONOS_VITA.forEach(t => {
      expect(t.id).toBeDefined()
      expect(t.nombre).toBeDefined()
      expect(t.hex).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })

  it('contiene formas dentarias validas', () => {
    expect(FORMAS_DENTARIAS.length).toBe(3)
  })

  it('define valores numericos correctos para proporcion dorada', () => {
    expect(PROPORCION_DORADA_TEORICA.visibilidadCentral).toBeCloseTo(1.618)
    expect(PROPORCION_DORADA_TEORICA.incisivoCentralAnchoAlto).toBe(0.8)
  })
})
