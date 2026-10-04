import { describe, it, expect } from 'vitest'
import { CONFIG_ESTADO } from './anestesiaConstants'

describe('anestesiaConstants', () => {
  it('contiene configuraciones visuales para los tres estados esperados', () => {
    expect(CONFIG_ESTADO.OK).toBeDefined()
    expect(CONFIG_ESTADO.DATOS_INCOMPLETOS).toBeDefined()
    expect(CONFIG_ESTADO.ANESTESICO_DESCONOCIDO).toBeDefined()

    Object.values(CONFIG_ESTADO).forEach(cfg => {
      expect(cfg).toHaveProperty('bg')
      expect(cfg).toHaveProperty('border')
      expect(cfg).toHaveProperty('text')
      expect(cfg).toHaveProperty('label')
    })
  })
})
