import { describe, it, expect } from 'vitest'
import {
  MARCAS_IMPLANTES,
  TIPOS_PLATAFORMA,
  CONEXIONES_DIAMETRO,
  TIPO_CONDUCTOS,
  TECNICAS_OBTURACION,
  SELLADORES_ENDODONTICOS
} from './quirurgicoConstants'

describe('quirurgicoConstants', () => {
  it('contiene listas de marcas de implantes y plataformas', () => {
    expect(MARCAS_IMPLANTES).toContain('Straumann')
    expect(TIPOS_PLATAFORMA).toContain('Cono Morse')
    expect(CONEXIONES_DIAMETRO.length).toBeGreaterThan(0)
  })

  it('contiene constantes para endodoncia', () => {
    expect(TIPO_CONDUCTOS.length).toBeGreaterThan(0)
    expect(TECNICAS_OBTURACION.length).toBeGreaterThan(0)
    expect(SELLADORES_ENDODONTICOS).toContain('Ah Plus (Resina)')
  })
})
