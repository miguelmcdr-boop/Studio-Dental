/**
 * Tests — calcularTubosAnestesia
 * Archivo: src/utils/anestesiaCalc.js
 * Tareas MASTER_ROADMAP: F1-06 (suite inicial) → F1-03 (corrección de fail-safe, este archivo actualizado)
 *
 * F1-03 corrigió el "Fail-Safe Clinical Default" (Constitución, Cap. V.2):
 * la función ya NO asume 70kg cuando el peso falta ni retorna un fallback
 * fijo cuando el anestésico es desconocido. En ambos casos retorna un
 * estado explícito ('DATOS_INCOMPLETOS' / 'ANESTESICO_DESCONOCIDO') con
 * mgMax/tubos en null, para que la UI bloquee el resultado en vez de
 * mostrar un número calculado sobre un supuesto.
 */

import { describe, it, expect } from 'vitest'
import { calcularTubosAnestesia } from './anestesiaCalc'

// ---------------------------------------------------------------------------
// Constantes farmacológicas de referencia (fuente: ADHA / fichas técnicas)
// Usadas para verificar la lógica matemática de la función.
// ---------------------------------------------------------------------------
const DOSIS = {
  lidocaina:    { mgKg: 4.4, mgTubo: 36  },  // 2% con epinefrina, tubo 1.8ml
  mepivacaina:  { mgKg: 6.6, mgTubo: 54  },  // 3%, tubo 1.8ml
  articaina:    { mgKg: 7.0, mgTubo: 72  },  // 4% con epinefrina, tubo 1.8ml
  bupivacaina:  { mgKg: 1.3, mgTubo: 9   },  // 0.5%, tubo 1.8ml
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mgEsperado  = (peso, tipo) => (peso * DOSIS[tipo].mgKg).toFixed(0)
const tubosEsperados = (peso, tipo) => Math.floor((peso * DOSIS[tipo].mgKg) / DOSIS[tipo].mgTubo)

// ===========================================================================
// BLOQUE 1 — Entradas válidas: peso informado correctamente
// estado debe ser siempre 'OK' cuando el cálculo es real (post F1-03).
// ===========================================================================
describe('calcularTubosAnestesia — entradas válidas (peso informado)', () => {

  describe('Lidocaína 2%', () => {
    it('calcula mgMax y tubos correctamente para 70 kg, con estado OK', () => {
      const result = calcularTubosAnestesia(70, 'lidocaina')
      expect(result.estado).toBe('OK')
      expect(result.mgMax).toBe(mgEsperado(70, 'lidocaina'))   // '308'
      expect(result.tubos).toBe(tubosEsperados(70, 'lidocaina')) // 8
    })

    it('calcula correctamente para paciente liviano (45 kg)', () => {
      const result = calcularTubosAnestesia(45, 'lidocaina')
      expect(result.mgMax).toBe(mgEsperado(45, 'lidocaina'))   // '198'
      expect(result.tubos).toBe(tubosEsperados(45, 'lidocaina')) // 5
    })

    it('calcula correctamente para paciente adulto mayor (55 kg)', () => {
      const result = calcularTubosAnestesia(55, 'lidocaina')
      expect(result.mgMax).toBe(mgEsperado(55, 'lidocaina'))
      expect(result.tubos).toBe(tubosEsperados(55, 'lidocaina'))
    })

    it('acepta peso como string numérico (input real de formulario HTML)', () => {
      const resultNum = calcularTubosAnestesia(60, 'lidocaina')
      const resultStr = calcularTubosAnestesia('60', 'lidocaina')
      expect(resultStr.mgMax).toBe(resultNum.mgMax)
      expect(resultStr.tubos).toBe(resultNum.tubos)
    })

    it('mgMax es string (comportamiento actual de toFixed — documentado para evitar regresión)', () => {
      const result = calcularTubosAnestesia(70, 'lidocaina')
      expect(typeof result.mgMax).toBe('string')
    })

    it('tubos es number entero (floor)', () => {
      const result = calcularTubosAnestesia(70, 'lidocaina')
      expect(typeof result.tubos).toBe('number')
      expect(Number.isInteger(result.tubos)).toBe(true)
    })
  })

  describe('Mepivacaína 3%', () => {
    it('calcula correctamente para 70 kg', () => {
      const result = calcularTubosAnestesia(70, 'mepivacaina')
      expect(result.mgMax).toBe(mgEsperado(70, 'mepivacaina'))
      expect(result.tubos).toBe(tubosEsperados(70, 'mepivacaina'))
    })

    it('calcula correctamente para 50 kg', () => {
      const result = calcularTubosAnestesia(50, 'mepivacaina')
      expect(result.mgMax).toBe(mgEsperado(50, 'mepivacaina'))
      expect(result.tubos).toBe(tubosEsperados(50, 'mepivacaina'))
    })
  })

  describe('Articaína 4%', () => {
    it('calcula correctamente para 70 kg', () => {
      const result = calcularTubosAnestesia(70, 'articaina')
      expect(result.mgMax).toBe(mgEsperado(70, 'articaina'))
      expect(result.tubos).toBe(tubosEsperados(70, 'articaina'))
    })

    it('calcula correctamente para 80 kg', () => {
      const result = calcularTubosAnestesia(80, 'articaina')
      expect(result.mgMax).toBe(mgEsperado(80, 'articaina'))
      expect(result.tubos).toBe(tubosEsperados(80, 'articaina'))
    })
  })

  describe('Bupivacaína 0.5%', () => {
    it('calcula correctamente para 70 kg', () => {
      const result = calcularTubosAnestesia(70, 'bupivacaina')
      expect(result.mgMax).toBe(mgEsperado(70, 'bupivacaina'))
      expect(result.tubos).toBe(tubosEsperados(70, 'bupivacaina'))
    })

    it('calcula correctamente para 40 kg (paciente pequeño)', () => {
      const result = calcularTubosAnestesia(40, 'bupivacaina')
      expect(result.mgMax).toBe(mgEsperado(40, 'bupivacaina'))
      expect(result.tubos).toBe(tubosEsperados(40, 'bupivacaina'))
    })
  })

  describe('Tipo de anestésico desconocido', () => {
    it('con peso válido pero anestésico no reconocido, bloquea el resultado en vez de usar un fallback fijo', () => {
      const result = calcularTubosAnestesia(70, 'prilocaina')
      expect(result.estado).toBe('ANESTESICO_DESCONOCIDO')
      expect(result.mgMax).toBeNull()
      expect(result.tubos).toBeNull()
      expect(result.mensaje).toMatch(/no reconocido/i)
    })
  })
})

// ===========================================================================
// BLOQUE 2 — Entradas inválidas: peso no informado o clínicamente absurdo
//
// ✅ COMPORTAMIENTO CORRECTO (post F1-03) — cumple Constitución Cap. V.2
// Ante cualquier peso no numérico, ausente, cero o negativo, la función
// NUNCA debe calcular una dosis — debe retornar un estado explícito de
// verificación manual requerida, con mgMax/tubos en null.
// ===========================================================================
describe('calcularTubosAnestesia — peso no informado o inválido (Fail-Safe Clinical Default)', () => {

  it('peso = undefined → estado DATOS_INCOMPLETOS, sin cálculo', () => {
    const result = calcularTubosAnestesia(undefined, 'lidocaina')
    expect(result.estado).toBe('DATOS_INCOMPLETOS')
    expect(result.mgMax).toBeNull()
    expect(result.tubos).toBeNull()
    expect(result.mensaje).toMatch(/verificación manual/i)
  })

  it('peso = null → estado DATOS_INCOMPLETOS, sin cálculo', () => {
    const result = calcularTubosAnestesia(null, 'lidocaina')
    expect(result.estado).toBe('DATOS_INCOMPLETOS')
    expect(result.mgMax).toBeNull()
    expect(result.tubos).toBeNull()
  })

  it('peso = "" (string vacío) → estado DATOS_INCOMPLETOS, sin cálculo', () => {
    const result = calcularTubosAnestesia('', 'lidocaina')
    expect(result.estado).toBe('DATOS_INCOMPLETOS')
    expect(result.mgMax).toBeNull()
    expect(result.tubos).toBeNull()
  })

  it('peso = 0 → estado DATOS_INCOMPLETOS (un peso de 0kg no es clínicamente válido)', () => {
    const result = calcularTubosAnestesia(0, 'lidocaina')
    expect(result.estado).toBe('DATOS_INCOMPLETOS')
    expect(result.mgMax).toBeNull()
    expect(result.tubos).toBeNull()
  })

  it('peso = "abc" (texto no numérico) → estado DATOS_INCOMPLETOS, sin cálculo', () => {
    const result = calcularTubosAnestesia('abc', 'lidocaina')
    expect(result.estado).toBe('DATOS_INCOMPLETOS')
    expect(result.mgMax).toBeNull()
    expect(result.tubos).toBeNull()
  })

  it('peso negativo (-5) → estado DATOS_INCOMPLETOS (ya no calcula dosis negativas)', () => {
    // Antes de F1-03 esto retornaba mgMax negativo, un resultado clínicamente
    // absurdo. Ahora un peso <= 0 se trata igual que un dato faltante.
    const result = calcularTubosAnestesia(-5, 'lidocaina')
    expect(result.estado).toBe('DATOS_INCOMPLETOS')
    expect(result.mgMax).toBeNull()
    expect(result.tubos).toBeNull()
  })

  it('peso = NaN explícito → estado DATOS_INCOMPLETOS, sin cálculo', () => {
    const result = calcularTubosAnestesia(NaN, 'lidocaina')
    expect(result.estado).toBe('DATOS_INCOMPLETOS')
    expect(result.mgMax).toBeNull()
    expect(result.tubos).toBeNull()
  })

  it('peso = Infinity → estado DATOS_INCOMPLETOS (no es un peso corporal real)', () => {
    const result = calcularTubosAnestesia(Infinity, 'lidocaina')
    expect(result.estado).toBe('DATOS_INCOMPLETOS')
    expect(result.mgMax).toBeNull()
    expect(result.tubos).toBeNull()
  })
})