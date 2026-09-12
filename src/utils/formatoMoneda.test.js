import { describe, it, expect } from 'vitest'
import { formatearCLP } from './formatoMoneda'

describe('formatoMoneda (Commit G2)', () => {
  it('formatea entero con símbolo y sufijo CLP', () => {
    expect(formatearCLP(50000)).toBe('$50.000 CLP')
  })

  it('formatea string numérico', () => {
    expect(formatearCLP('1234567')).toBe('$1.234.567 CLP')
  })

  it('retorna $0 CLP para undefined, null o NaN', () => {
    expect(formatearCLP(undefined)).toBe('$0 CLP')
    expect(formatearCLP(null)).toBe('$0 CLP')
    expect(formatearCLP('abc')).toBe('$0 CLP')
  })

  it('trunca decimales (CLP sin centavos)', () => {
    expect(formatearCLP(50000.9)).toBe('$50.000 CLP')
  })

  it('formatea cero', () => {
    expect(formatearCLP(0)).toBe('$0 CLP')
  })
})
