import { describe, it, expect } from 'vitest'
import {
  CONVENIOS_DEFAULT,
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
  METODOS_PAGO_OPCIONES,
  PORCENTAJE_RETENCION_HONORARIOS_DEFAULT
} from './finanzasConstants'

describe('finanzasConstants', () => {
  it('contiene convenios por defecto estructurados', () => {
    expect(CONVENIOS_DEFAULT.length).toBe(4)
    CONVENIOS_DEFAULT.forEach(c => {
      expect(c.id).toBeDefined()
      expect(c.nombre).toBeDefined()
      expect(typeof c.descuentoDefecto).toBe('number')
    })
  })

  it('contiene categorias de egreso e ingreso', () => {
    expect(CATEGORIAS_EGRESO.length).toBeGreaterThan(0)
    expect(CATEGORIAS_INGRESO.length).toBeGreaterThan(0)
  })

  it('define metodos de pago y porcentaje de retencion legal chileno', () => {
    expect(METODOS_PAGO_OPCIONES.some(m => m.id === 'Efectivo')).toBe(true)
    expect(PORCENTAJE_RETENCION_HONORARIOS_DEFAULT).toBe(13.75)
  })
})
