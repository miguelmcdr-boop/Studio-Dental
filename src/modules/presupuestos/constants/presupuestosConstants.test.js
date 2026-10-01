import { describe, it, expect } from 'vitest'
import {
  ESTADOS_PRESUPUESTO,
  OPCIONES_CUOTAS,
  PRESUPUESTOS_DEFAULT
} from './presupuestosConstants'

describe('presupuestosConstants', () => {
  it('contiene estados de presupuesto estructurados', () => {
    expect(ESTADOS_PRESUPUESTO.some(e => e.id === 'Aprobado')).toBe(true)
    expect(ESTADOS_PRESUPUESTO.some(e => e.id === 'EnTratamiento')).toBe(true)
  })

  it('contiene opciones de cuotas', () => {
    expect(OPCIONES_CUOTAS.length).toBeGreaterThan(0)
    expect(OPCIONES_CUOTAS[0].cuotas).toBe(1)
  })

  it('define presupuestos por defecto con folio e items', () => {
    expect(PRESUPUESTOS_DEFAULT.length).toBeGreaterThan(0)
    expect(PRESUPUESTOS_DEFAULT[0].folio).toBeDefined()
    expect(PRESUPUESTOS_DEFAULT[0].items.length).toBeGreaterThan(0)
  })
})
