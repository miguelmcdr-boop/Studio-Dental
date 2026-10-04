import { describe, it, expect } from 'vitest'
import { PLANTILLAS_CONSENTIMIENTO } from './plantillasConsentimiento'

describe('plantillasConsentimiento', () => {
  it('contiene plantillas predeterminadas con id, nombre y texto', () => {
    expect(PLANTILLAS_CONSENTIMIENTO.length).toBeGreaterThan(0)
    PLANTILLAS_CONSENTIMIENTO.forEach(p => {
      expect(p.id).toBeDefined()
      expect(p.nombre).toBeDefined()
      expect(p.texto).toBeDefined()
      expect(p.texto.length).toBeGreaterThan(20)
    })
  })
})
