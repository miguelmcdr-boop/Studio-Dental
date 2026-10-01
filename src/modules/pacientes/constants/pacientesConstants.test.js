import { describe, it, expect } from 'vitest'
import {
  TABS_FICHA_PACIENTE,
  PERMANENTE_SUPERIOR,
  PERMANENTE_INFERIOR
} from './pacientesConstants'

describe('pacientesConstants', () => {
  it('contiene las pestañas de la ficha de paciente', () => {
    expect(TABS_FICHA_PACIENTE).toContain('Ficha Clínica')
    expect(TABS_FICHA_PACIENTE).toContain('Odontograma Inicial')
    expect(TABS_FICHA_PACIENTE).toContain('Periodontograma')
  })

  it('contiene 16 piezas en cada arcada permanente', () => {
    expect(PERMANENTE_SUPERIOR.length).toBe(16)
    expect(PERMANENTE_INFERIOR.length).toBe(16)
  })
})
