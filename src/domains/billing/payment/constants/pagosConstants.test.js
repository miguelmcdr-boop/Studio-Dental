import { describe, it, expect } from 'vitest'
import {
  TIPOS_DOCUMENTO_TRIBUTARIO,
  METODOS_PAGO_GOLD,
  CONCEPTOS_PAGO,
  PAGOS_DEFAULT
} from './pagosConstants'

describe('pagosConstants', () => {
  it('contiene documentos tributarios con retencion', () => {
    expect(TIPOS_DOCUMENTO_TRIBUTARIO.some(d => d.id === 'boleta_honorarios')).toBe(true)
    expect(TIPOS_DOCUMENTO_TRIBUTARIO.some(d => d.id === 'boleta_exenta')).toBe(true)
  })

  it('contiene metodos de pago y conceptos', () => {
    expect(METODOS_PAGO_GOLD.length).toBeGreaterThan(0)
    expect(CONCEPTOS_PAGO.length).toBeGreaterThan(0)
  })

  it('define pagos por defecto validos', () => {
    expect(PAGOS_DEFAULT.length).toBeGreaterThan(0)
    expect(PAGOS_DEFAULT[0].monto).toBe(100000)
  })
})
