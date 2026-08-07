/**
 * Tests — evaluarIncompatibilidadFarmaco
 * Archivo: src/modules/pacientes/utils/pacientesCalculations.js
 * Tarea MASTER_ROADMAP: F1-04a
 *
 * Cubre la corrección del fail-safe clínico (Constitución, Cap. V.2):
 * alergias no informadas deben retornar un estado explícito ('sin_datos'),
 * nunca el mismo `null` que significa "verificado, sin incompatibilidad".
 */

import { describe, it, expect } from 'vitest'
import { evaluarIncompatibilidadFarmaco } from './pacientesCalculations'

describe('evaluarIncompatibilidadFarmaco', () => {

  // =========================================================================
  // Fail-safe: alergias no informadas
  // =========================================================================
  describe('alergias no informadas (Fail-Safe Clinical Default)', () => {
    it('alergiasTexto = "" → tipo sin_datos, nunca null', () => {
      const result = evaluarIncompatibilidadFarmaco('Amoxicilina', '')
      expect(result).not.toBeNull()
      expect(result.tipo).toBe('sin_datos')
    })

    it('alergiasTexto = undefined → tipo sin_datos, nunca null', () => {
      const result = evaluarIncompatibilidadFarmaco('Amoxicilina', undefined)
      expect(result).not.toBeNull()
      expect(result.tipo).toBe('sin_datos')
    })

    it('alergiasTexto = null → tipo sin_datos, sin lanzar excepción', () => {
      expect(() => evaluarIncompatibilidadFarmaco('Amoxicilina', null)).not.toThrow()
      const result = evaluarIncompatibilidadFarmaco('Amoxicilina', null)
      expect(result.tipo).toBe('sin_datos')
    })

    it('alergiasTexto = "   " (solo espacios) → tipo sin_datos', () => {
      const result = evaluarIncompatibilidadFarmaco('Ibuprofeno', '   ')
      expect(result.tipo).toBe('sin_datos')
    })

    it('el mensaje de sin_datos indica explícitamente que falta verificar', () => {
      const result = evaluarIncompatibilidadFarmaco('Amoxicilina', '')
      expect(result.mensaje).toMatch(/no registradas/i)
      expect(result.sugerencia).toMatch(/verifique manualmente/i)
    })
  })

  // =========================================================================
  // Alergia a Penicilinas/Betalactámicos — caso crítico
  // =========================================================================
  describe('alergia a Penicilinas/Betalactámicos informada', () => {
    it('detecta incompatibilidad crítica: alergia "Penicilina" + receta "Amoxicilina"', () => {
      const result = evaluarIncompatibilidadFarmaco('Amoxicilina', 'Alergia a Penicilina')
      expect(result.tipo).toBe('critica')
    })

    it('detecta incompatibilidad crítica: alergia "Betalactamico" + receta "Penicilina"', () => {
      const result = evaluarIncompatibilidadFarmaco('Penicilina V', 'Alergia a Betalactamico')
      expect(result.tipo).toBe('critica')
    })

    it('no distingue mayúsculas/minúsculas en ninguno de los dos textos', () => {
      const result = evaluarIncompatibilidadFarmaco('AMOXICILINA', 'PENICILINA')
      expect(result.tipo).toBe('critica')
    })

    it('alergia a penicilina pero receta de un fármaco no relacionado → no dispara la alerta crítica', () => {
      const result = evaluarIncompatibilidadFarmaco('Paracetamol', 'Alergia a Penicilina')
      expect(result === null || result.tipo !== 'critica').toBe(true)
    })
  })

  // =========================================================================
  // Alergia a AINEs — caso de advertencia
  // =========================================================================
  describe('alergia a AINEs informada', () => {
    it('detecta advertencia: alergia "AINE" + receta "Ibuprofeno"', () => {
      const result = evaluarIncompatibilidadFarmaco('Ibuprofeno 400mg', 'Alergia a AINEs')
      expect(result.tipo).toBe('advertencia')
    })

    it('detecta advertencia: alergia "Aspirina" + receta "Diclofenaco"', () => {
      const result = evaluarIncompatibilidadFarmaco('Diclofenaco Sódico', 'Alergia a Aspirina')
      expect(result.tipo).toBe('advertencia')
    })

    it('cubre Ketorolaco, Ketoprofeno y Naproxeno como fármacos de esta categoría', () => {
      expect(evaluarIncompatibilidadFarmaco('Ketorolaco', 'Alergia a AINEs').tipo).toBe('advertencia')
      expect(evaluarIncompatibilidadFarmaco('Ketoprofeno', 'Alergia a AINEs').tipo).toBe('advertencia')
      expect(evaluarIncompatibilidadFarmaco('Naproxeno', 'Alergia a AINEs').tipo).toBe('advertencia')
    })
  })

  // =========================================================================
  // Alergias informadas, pero fuera de las 2 categorías cubiertas
  // (comportamiento legítimo: null, porque SÍ se verificó contra lo que
  //  la función sabe cubrir — el aviso de cobertura limitada vive en la UI)
  // =========================================================================
  describe('alergias informadas pero fuera de la cobertura de esta validación', () => {
    it('alergia a "Látex" (no cubierta) + receta de Amoxicilina → null, no falso negativo de las categorías sí cubiertas', () => {
      const result = evaluarIncompatibilidadFarmaco('Amoxicilina', 'Alergia a Látex')
      expect(result).toBeNull()
    })

    it('alergias informadas + fármaco no perteneciente a ninguna categoría → null', () => {
      const result = evaluarIncompatibilidadFarmaco('Paracetamol', 'Alergia a Penicilina')
      expect(result).toBeNull()
    })
  })

  // =========================================================================
  // Robustez ante entradas no-string
  // =========================================================================
  describe('robustez ante entradas inesperadas', () => {
    it('textoMedicamento vacío o undefined no lanza excepción', () => {
      expect(() => evaluarIncompatibilidadFarmaco('', 'Alergia a Penicilina')).not.toThrow()
      expect(() => evaluarIncompatibilidadFarmaco(undefined, 'Alergia a Penicilina')).not.toThrow()
    })

    it('ambos parámetros ausentes no lanza excepción y retorna sin_datos', () => {
      expect(() => evaluarIncompatibilidadFarmaco(undefined, undefined)).not.toThrow()
      expect(evaluarIncompatibilidadFarmaco(undefined, undefined).tipo).toBe('sin_datos')
    })
  })
})