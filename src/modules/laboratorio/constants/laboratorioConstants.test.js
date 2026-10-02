import { describe, it, expect } from 'vitest'
import {
  ETAPAS_LABORATORIO,
  TIPOS_TRABAJO_SUGERIDOS,
  LABORATORIOS_BASE,
  ORDENES_DEFAULT
} from './laboratorioConstants'

describe('laboratorioConstants', () => {
  it('define etapas de laboratorio con estilos', () => {
    expect(ETAPAS_LABORATORIO.length).toBe(6)
    ETAPAS_LABORATORIO.forEach(e => {
      expect(e.id).toBeDefined()
      expect(e.nombre).toBeDefined()
      expect(e.colorBg).toBeDefined()
    })
  })

  it('contiene sugerencias de tipos de trabajo', () => {
    expect(TIPOS_TRABAJO_SUGERIDOS.length).toBeGreaterThan(0)
    expect(TIPOS_TRABAJO_SUGERIDOS).toContain('Corona de Zirconio Monolítico')
  })

  it('contiene laboratorios base estructurados', () => {
    expect(LABORATORIOS_BASE.length).toBeGreaterThan(0)
    LABORATORIOS_BASE.forEach(lab => {
      expect(lab.id).toBeDefined()
      expect(lab.nombre).toBeDefined()
      expect(Array.isArray(lab.tarifas)).toBe(true)
    })
  })

  it('contiene ordenes default estructuradas', () => {
    expect(ORDENES_DEFAULT.length).toBeGreaterThan(0)
    expect(ORDENES_DEFAULT[0].codigoOrden).toBeDefined()
  })
})
