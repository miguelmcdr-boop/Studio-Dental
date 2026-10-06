import { describe, it, expect } from 'vitest'
import { ACCESOS_RAPIDOS } from './dashboardConstants'

describe('dashboardConstants', () => {
  it('contiene los accesos rapidos definidos con su estructura', () => {
    expect(ACCESOS_RAPIDOS.length).toBe(4)
    ACCESOS_RAPIDOS.forEach(item => {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('nombre')
      expect(item).toHaveProperty('seccion')
      expect(item).toHaveProperty('color')
    })
  })
})
