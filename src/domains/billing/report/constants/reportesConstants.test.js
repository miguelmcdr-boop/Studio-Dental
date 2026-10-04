import { describe, it, expect } from 'vitest'
import {
  PERIODOS_REPORTES,
  ESPECIALIDADES_COLOR
} from './reportesConstants'

describe('reportesConstants', () => {
  it('contiene periodos de reportes estructurados', () => {
    expect(PERIODOS_REPORTES.length).toBe(5)
    PERIODOS_REPORTES.forEach(p => {
      expect(p.id).toBeDefined()
      expect(p.nombre).toBeDefined()
    })
  })

  it('asigna clases de color para especialidades clinicas', () => {
    expect(ESPECIALIDADES_COLOR['Endodoncia']).toBe('bg-purple-500')
    expect(ESPECIALIDADES_COLOR['Periodoncia']).toBe('bg-teal-500')
  })
})
