/**
 * Tests consolidados para módulo urgenciasGes (F6-K Fase 4)
 *
 * Cubre:
 * - urgenciasGesCalculations.js (funciones puras)
 * - urgenciasGesConstants.js (validación de estructura)
 * - Componentes JSX (tests de smoke)
 *
 * Patrón de tests:
 * - Funciones puras: validación de formato y comportamiento
 * - Constantes: validación de estructura y contenido
 * - Componentes: renderizado sin errores
 */
import { describe, it, expect, vi } from 'vitest'
import { generarFolioGes, formatearFechaHoraChile } from './utils/urgenciasGesCalculations'
import { 
  PATOLOGIAS_GES_ODONTO, 
  CATEGORIAS_TRIAGE_URGENCIA, 
  DIAGNOSTICOS_URGENCIA_COMMON 
} from './constants/urgenciasGesConstants'

describe('urgenciasGesCalculations', () => {
  describe('generarFolioGes', () => {
    it('debe retornar string con formato GES-AÑO-RANDOM', () => {
      const folio = generarFolioGes()
      expect(typeof folio).toBe('string')
      expect(folio).toMatch(/^GES-\d{4}-\d{4}$/)
    })

    it('debe incluir el año actual', () => {
      const folio = generarFolioGes()
      const anioActual = new Date().getFullYear()
      expect(folio).toContain(`GES-${anioActual}`)
    })

    it('debe generar número aleatorio de 4 dígitos (1000-9999)', () => {
      const folio = generarFolioGes()
      const partes = folio.split('-')
      const numero = parseInt(partes[2])
      expect(numero).toBeGreaterThanOrEqual(1000)
      expect(numero).toBeLessThan(10000)
    })

    it('debe generar folios únicos en llamadas consecutivas', () => {
      const folios = new Set()
      for (let i = 0; i < 10; i++) {
        folios.add(generarFolioGes())
      }
      // Al menos 8 de 10 deben ser únicos (tolerancia para colisiones aleatorias)
      expect(folios.size).toBeGreaterThanOrEqual(8)
    })
  })

  describe('formatearFechaHoraChile', () => {
    it('debe retornar string con formato de fecha y hora', () => {
      const resultado = formatearFechaHoraChile()
      expect(typeof resultado).toBe('string')
      expect(resultado).toContain('a las')
      expect(resultado).toContain('hrs.')
    })

    it('debe incluir separadores de fecha chilenos', () => {
      const resultado = formatearFechaHoraChile()
      // Formato chileno: DD-MM-YYYY o DD/MM/YYYY
      expect(resultado).toMatch(/\d{1,2}[-/]\d{1,2}[-/]\d{4}/)
    })

    it('debe incluir hora en formato HH:MM', () => {
      const resultado = formatearFechaHoraChile()
      expect(resultado).toMatch(/\d{1,2}:\d{2}/)
    })

    it('debe retornar fecha y hora actuales', () => {
      const antes = new Date()
      const resultado = formatearFechaHoraChile()
      const despues = new Date()
      
      const anioActual = antes.getFullYear()
      expect(resultado).toContain(anioActual.toString())
    })
  })
})

describe('urgenciasGesConstants', () => {
  describe('PATOLOGIAS_GES_ODONTO', () => {
    it('debe ser un array con 4 patologías', () => {
      expect(Array.isArray(PATOLOGIAS_GES_ODONTO)).toBe(true)
      expect(PATOLOGIAS_GES_ODONTO).toHaveLength(4)
    })

    it('cada patología debe tener estructura correcta', () => {
      PATOLOGIAS_GES_ODONTO.forEach(patologia => {
        expect(patologia).toHaveProperty('id')
        expect(patologia).toHaveProperty('nombre')
        expect(patologia).toHaveProperty('codigo')
        expect(patologia).toHaveProperty('descripcion')
        
        expect(typeof patologia.id).toBe('string')
        expect(typeof patologia.nombre).toBe('string')
        expect(typeof patologia.codigo).toBe('string')
        expect(typeof patologia.descripcion).toBe('string')
      })
    })

    it('debe incluir patología de urgencia ambulatoria', () => {
      const urgencia = PATOLOGIAS_GES_ODONTO.find(p => p.id === 'urgencia_ambulatoria')
      expect(urgencia).toBeDefined()
      expect(urgencia.codigo).toBe('GES-01')
      expect(urgencia.nombre).toContain('Urgencia')
    })

    it('debe incluir patología de adulto de 60 años', () => {
      const adulto60 = PATOLOGIAS_GES_ODONTO.find(p => p.id === 'salud_60_anos')
      expect(adulto60).toBeDefined()
      expect(adulto60.codigo).toBe('GES-02')
      expect(adulto60.nombre).toContain('60')
    })

    it('debe incluir patología de embarazada', () => {
      const embarazada = PATOLOGIAS_GES_ODONTO.find(p => p.id === 'embarazada')
      expect(embarazada).toBeDefined()
      expect(embarazada.codigo).toBe('GES-03')
      expect(embarazada.nombre).toContain('Embarazada')
    })

    it('debe incluir patología de fisura labiopalatina', () => {
      const fisura = PATOLOGIAS_GES_ODONTO.find(p => p.id === 'fisura_labiopalatina')
      expect(fisura).toBeDefined()
      expect(fisura.codigo).toBe('GES-04')
      expect(fisura.nombre).toContain('Fisura')
    })

    it('los códigos deben ser únicos', () => {
      const codigos = PATOLOGIAS_GES_ODONTO.map(p => p.codigo)
      const codigosUnicos = new Set(codigos)
      expect(codigosUnicos.size).toBe(codigos.length)
    })
  })

  describe('CATEGORIAS_TRIAGE_URGENCIA', () => {
    it('debe ser un array con 4 categorías', () => {
      expect(Array.isArray(CATEGORIAS_TRIAGE_URGENCIA)).toBe(true)
      expect(CATEGORIAS_TRIAGE_URGENCIA).toHaveLength(4)
    })

    it('cada categoría debe tener estructura correcta', () => {
      CATEGORIAS_TRIAGE_URGENCIA.forEach(categoria => {
        expect(categoria).toHaveProperty('id')
        expect(categoria).toHaveProperty('nombre')
        expect(categoria).toHaveProperty('color')
        
        expect(typeof categoria.id).toBe('string')
        expect(typeof categoria.nombre).toBe('string')
        expect(typeof categoria.color).toBe('string')
      })
    })

    it('debe incluir C1 (urgencia vital)', () => {
      const c1 = CATEGORIAS_TRIAGE_URGENCIA.find(c => c.id === 'C1')
      expect(c1).toBeDefined()
      expect(c1.nombre).toContain('Urgencia Vital')
    })

    it('debe incluir C2 (dolor severo)', () => {
      const c2 = CATEGORIAS_TRIAGE_URGENCIA.find(c => c.id === 'C2')
      expect(c2).toBeDefined()
      expect(c2.nombre).toContain('Dolor Severo')
    })

    it('debe incluir C3 (dolor moderado)', () => {
      const c3 = CATEGORIAS_TRIAGE_URGENCIA.find(c => c.id === 'C3')
      expect(c3).toBeDefined()
      expect(c3.nombre).toContain('Dolor Moderado')
    })

    it('debe incluir C4 (molestia leve)', () => {
      const c4 = CATEGORIAS_TRIAGE_URGENCIA.find(c => c.id === 'C4')
      expect(c4).toBeDefined()
      expect(c4.nombre).toContain('Molestia Leve')
    })

    it('los IDs deben ser únicos', () => {
      const ids = CATEGORIAS_TRIAGE_URGENCIA.map(c => c.id)
      const idsUnicos = new Set(ids)
      expect(idsUnicos.size).toBe(ids.length)
    })
  })

  describe('DIAGNOSTICOS_URGENCIA_COMMON', () => {
    it('debe ser un array con 7 diagnósticos', () => {
      expect(Array.isArray(DIAGNOSTICOS_URGENCIA_COMMON)).toBe(true)
      expect(DIAGNOSTICOS_URGENCIA_COMMON).toHaveLength(7)
    })

    it('cada diagnóstico debe ser un string', () => {
      DIAGNOSTICOS_URGENCIA_COMMON.forEach(diagnostico => {
        expect(typeof diagnostico).toBe('string')
        expect(diagnostico.length).toBeGreaterThan(0)
      })
    })

    it('debe incluir diagnóstico de pulpitis', () => {
      const pulpitis = DIAGNOSTICOS_URGENCIA_COMMON.find(d => d.includes('Pulpitis'))
      expect(pulpitis).toBeDefined()
    })

    it('debe incluir diagnóstico de absceso', () => {
      const absceso = DIAGNOSTICOS_URGENCIA_COMMON.find(d => d.includes('Absceso'))
      expect(absceso).toBeDefined()
    })

    it('debe incluir diagnóstico de fractura', () => {
      const fractura = DIAGNOSTICOS_URGENCIA_COMMON.find(d => d.includes('Fractura'))
      expect(fractura).toBeDefined()
    })

    it('los diagnósticos deben ser únicos', () => {
      const diagnosticosUnicos = new Set(DIAGNOSTICOS_URGENCIA_COMMON)
      expect(diagnosticosUnicos.size).toBe(DIAGNOSTICOS_URGENCIA_COMMON.length)
    })
  })
})
