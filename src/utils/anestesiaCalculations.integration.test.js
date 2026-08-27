/**
 * Tests de integración F7-02: Verificar que vademecumService y anestesiaCalculations
 * usan unidades correctas (mg vs mg/kg) y no confunden dosis adultas con pediátricas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de vademecumService
vi.mock('../services/vademecumService', () => ({
  vademecumService: {
    obtenerDosisAnestesia: vi.fn()
  }
}))

vi.mock('../services/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

import { vademecumService } from '../services/vademecumService'
import { obtenerDatosAnestesia } from './anestesiaCalculations'

describe('F7-02: Integración vademecumService → anestesiaCalculations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Mapeo de unidades correctas', () => {
    it('debe mapear dosisMaxAdulto_mgPorKg (calculado) correctamente', () => {
      const mockData = [{
        id: 1,
        nombre: 'Lidocaína 2% + Epinefrina',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: 4.28,  // 300mg / 70kg
        dosisMaxPediatrico_mgPorKg: 4.4,
        topeAbsolutoAdulto_mg: 300,
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 36,
        volumenPorUnidad_ml: 1.8,
        concentracion_mgPorMl: 20,
        contraindicaciones: 'Bloqueo AV',
        notas: 'Embarazo: de elección'
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()

      expect(resultado).toHaveLength(1)
      expect(resultado[0].mgPorKgAdulto).toBe(4.28)
      expect(resultado[0].topeAbsolutoAdulto).toBe(300)
    })

    it('debe mapear dosisMaxPediatrico_mgPorKg directamente desde SQL', () => {
      const mockData = [{
        id: 1,
        nombre: 'Articaína 4%',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: 7.0,
        dosisMaxPediatrico_mgPorKg: 7.0,
        topeAbsolutoAdulto_mg: 500,
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 72,
        volumenPorUnidad_ml: 1.8,
        concentracion_mgPorMl: 40,
        contraindicaciones: '',
        notas: ''
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()

      expect(resultado[0].mgPorKgPediatrico).toBe(7.0)
    })

    it('NO debe confundir topeAbsolutoAdulto (mg) con mg/kg', () => {
      const mockData = [{
        id: 2,
        nombre: 'Mepivacaína 3%',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: 5.71,  // 400mg / 70kg
        dosisMaxPediatrico_mgPorKg: 4.4,
        topeAbsolutoAdulto_mg: 400,  // Este es ABSOLUTO, no mg/kg
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 54,
        volumenPorUnidad_ml: 1.8,
        concentracion_mgPorMl: 30,
        contraindicaciones: '',
        notas: ''
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()

      // mgPorKgAdulto debe ser el valor relativo (5.71), NO el absoluto (400)
      expect(resultado[0].mgPorKgAdulto).toBe(5.71)
      expect(resultado[0].mgPorKgAdulto).not.toBe(400)
      
      // topeAbsolutoAdulto debe ser el valor absoluto (400)
      expect(resultado[0].topeAbsolutoAdulto).toBe(400)
    })
  })

  describe('Valores conocidos de los 4 anestésicos principales', () => {
    it('Lidocaína debe tener valores correctos', () => {
      const mockData = [{
        id: 1,
        nombre: 'Lidocaína 2% + Epinefrina 1:100.000',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: 4.28,
        dosisMaxPediatrico_mgPorKg: 4.4,
        topeAbsolutoAdulto_mg: 300,
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 36,
        volumenPorUnidad_ml: 1.8,
        concentracion_mgPorMl: 20,
        contraindicaciones: 'Bloqueo AV severo',
        notas: 'Embarazo: de elección'
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()
      const lido = resultado[0]

      expect(lido.mgPorKgAdulto).toBeCloseTo(4.28, 2)
      expect(lido.mgPorKgPediatrico).toBe(4.4)
      expect(lido.topeAbsolutoAdulto).toBe(300)
      expect(lido.mgPorTubo).toBe(36)
      expect(lido.volumenPorTubo).toBe(1.8)
    })

    it('Mepivacaína debe tener valores correctos', () => {
      const mockData = [{
        id: 2,
        nombre: 'Mepivacaína 3% sin vasoconstrictor',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: 5.71,
        dosisMaxPediatrico_mgPorKg: 4.4,
        topeAbsolutoAdulto_mg: 400,
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 54,
        volumenPorUnidad_ml: 1.8,
        concentracion_mgPorMl: 30,
        contraindicaciones: '',
        notas: ''
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()
      const mepi = resultado[0]

      expect(mepi.mgPorKgAdulto).toBeCloseTo(5.71, 2)
      expect(mepi.topeAbsolutoAdulto).toBe(400)
      expect(mepi.mgPorTubo).toBe(54)
    })

    it('Articaína debe tener valores correctos', () => {
      const mockData = [{
        id: 3,
        nombre: 'Articaína 4% + Epinefrina 1:100.000',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: 7.0,
        dosisMaxPediatrico_mgPorKg: 7.0,
        topeAbsolutoAdulto_mg: 500,
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 72,
        volumenPorUnidad_ml: 1.8,
        concentracion_mgPorMl: 40,
        contraindicaciones: 'Contraindicado <4 años',
        notas: ''
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()
      const arti = resultado[0]

      expect(arti.mgPorKgAdulto).toBe(7.0)
      expect(arti.topeAbsolutoAdulto).toBe(500)
      expect(arti.mgPorTubo).toBe(72)
    })

    it('Bupivacaína debe tener valores correctos', () => {
      const mockData = [{
        id: 4,
        nombre: 'Bupivacaína 0.5% + Epinefrina 1:200.000',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: 1.29,  // 90mg / 70kg
        dosisMaxPediatrico_mgPorKg: null,  // No hay dato pediátrico
        topeAbsolutoAdulto_mg: 90,
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 9,
        volumenPorUnidad_ml: 1.8,
        concentracion_mgPorMl: 5,
        contraindicaciones: 'Cardiopatía isquémica severa',
        notas: ''
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()
      const bupi = resultado[0]

      expect(bupi.mgPorKgAdulto).toBeCloseTo(1.29, 2)
      expect(bupi.topeAbsolutoAdulto).toBe(90)
      expect(bupi.mgPorTubo).toBe(9)
      expect(bupi.mgPorKgPediatrico).toBeNull()
    })
  })

  describe('Manejo de valores nulos/inválidos', () => {
    it('debe manejar topeAbsolutoAdulto_mg = null sin error', () => {
      const mockData = [{
        id: 5,
        nombre: 'Anestésico incompleto',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: null,
        dosisMaxPediatrico_mgPorKg: null,
        topeAbsolutoAdulto_mg: null,
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 36,
        volumenPorUnidad_ml: 1.8,
        concentracion_mgPorMl: 20,
        contraindicaciones: '',
        notas: ''
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()

      expect(resultado[0].mgPorKgAdulto).toBeNull()
      expect(resultado[0].topeAbsolutoAdulto).toBeNull()
    })

    it('debe manejar volumenPorUnidad_ml = 0 usando fallback 1.8', () => {
      const mockData = [{
        id: 6,
        nombre: 'Anestésico con volumen cero',
        familia: 'anestesico_amida',
        presentacion: 'Tubo 1.8ml',
        dosisMaxAdulto_mgPorKg: 4.0,
        dosisMaxPediatrico_mgPorKg: 4.0,
        topeAbsolutoAdulto_mg: 300,
        topeAbsolutoPediatrico_mg: null,
        contenidoPorUnidad_mg: 36,
        volumenPorUnidad_ml: 0,  // Valor inválido
        concentracion_mgPorMl: 20,
        contraindicaciones: '',
        notas: ''
      }]

      vi.mocked(vademecumService.obtenerDosisAnestesia).mockReturnValue(mockData)

      const resultado = obtenerDatosAnestesia()

      // Debe usar fallback 1.8 cuando volumenPorUnidad_ml es 0 (falsy)
      expect(resultado[0].volumenPorTubo).toBe(1.8)
    })
  })
})
