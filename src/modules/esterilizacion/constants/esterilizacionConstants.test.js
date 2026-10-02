import { describe, it, expect } from 'vitest'
import {
  EQUIPOS_AUTOCLAVE,
  PROGRAMAS_ESTERILIZACION,
  INDICADORES_QUIMICOS,
  INDICADORES_BIOLOGICOS,
  RESULTADOS_BOWIE_DICK,
  CARGAS_DEFAULT,
  PRUEBAS_BIOLOGICAS_DEFAULT,
  TEST_BOWIE_DICK_DEFAULT
} from './esterilizacionConstants'

describe('esterilizacionConstants', () => {
  it('contiene equipos de autoclave normados', () => {
    expect(EQUIPOS_AUTOCLAVE.length).toBeGreaterThan(0)
    expect(EQUIPOS_AUTOCLAVE[0]).toContain('Autoclave')
  })

  it('contiene programas de esterilización con parámetros técnicos', () => {
    expect(PROGRAMAS_ESTERILIZACION.length).toBeGreaterThan(0)
    PROGRAMAS_ESTERILIZACION.forEach(p => {
      expect(p.id).toBeDefined()
      expect(typeof p.tempEsperada).toBe('number')
      expect(typeof p.tiempoEsperado).toBe('number')
      expect(typeof p.presionEsperada).toBe('number')
    })
  })

  it('contiene indicadores químicos, biológicos y resultados bowie-dick', () => {
    expect(INDICADORES_QUIMICOS.length).toBe(4)
    expect(INDICADORES_BIOLOGICOS.length).toBe(3)
    expect(RESULTADOS_BOWIE_DICK.length).toBe(2)
  })

  it('contiene registros default estructurados', () => {
    expect(CARGAS_DEFAULT.length).toBeGreaterThan(0)
    expect(CARGAS_DEFAULT[0].estado).toBe('Conforme')
    expect(PRUEBAS_BIOLOGICAS_DEFAULT.length).toBeGreaterThan(0)
    expect(TEST_BOWIE_DICK_DEFAULT.length).toBeGreaterThan(0)
  })
})
