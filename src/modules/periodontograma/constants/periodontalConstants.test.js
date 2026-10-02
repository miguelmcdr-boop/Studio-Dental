import { describe, it, expect } from 'vitest'
import {
  ARCADA_SUPERIOR,
  ARCADA_INFERIOR,
  SITIOS_TOTALES,
  DIENTES_MULTIRRADICULARES,
  LIMITES_SONDAJE,
  OPCIONES_MOVILIDAD,
  OPCIONES_FURCA
} from './periodontalConstants'

describe('periodontalConstants', () => {
  it('contiene 16 piezas en cada arcada periodontal', () => {
    expect(ARCADA_SUPERIOR.length).toBe(16)
    expect(ARCADA_INFERIOR.length).toBe(16)
  })

  it('define 6 sitios por pieza dental', () => {
    expect(SITIOS_TOTALES.length).toBe(6)
  })

  it('define dientes multirradiculares y limites clinicos de sondaje', () => {
    expect(DIENTES_MULTIRRADICULARES.length).toBeGreaterThan(0)
    expect(LIMITES_SONDAJE.MIN).toBe(0)
    expect(LIMITES_SONDAJE.MAX).toBe(12)
    expect(OPCIONES_MOVILIDAD).toContain('3')
    expect(OPCIONES_FURCA).toContain('3')
  })
})
