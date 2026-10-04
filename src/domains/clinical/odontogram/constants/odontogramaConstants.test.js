import { describe, it, expect } from 'vitest'
import {
  PERMANENTE_SUPERIOR,
  PERMANENTE_INFERIOR,
  TEMPORAL_SUPERIOR,
  TEMPORAL_INFERIOR,
  HERRAMIENTAS_ODONTOGRAMA
} from './odontogramaConstants'

describe('odontogramaConstants', () => {
  it('contiene 16 piezas en cada arcada permanente', () => {
    expect(PERMANENTE_SUPERIOR.length).toBe(16)
    expect(PERMANENTE_INFERIOR.length).toBe(16)
  })

  it('contiene 10 piezas en cada arcada temporal', () => {
    expect(TEMPORAL_SUPERIOR.length).toBe(10)
    expect(TEMPORAL_INFERIOR.length).toBe(10)
  })

  it('contiene herramientas con id, label y color', () => {
    expect(HERRAMIENTAS_ODONTOGRAMA.length).toBeGreaterThan(0)
    HERRAMIENTAS_ODONTOGRAMA.forEach(h => {
      expect(h.id).toBeDefined()
      expect(h.label).toBeDefined()
      expect(h.color).toBeDefined()
    })
  })
})
