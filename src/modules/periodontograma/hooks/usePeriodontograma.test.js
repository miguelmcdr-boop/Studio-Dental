/**
 * Tests de integración para usePeriodontograma (F3-04)
 *
 * Hook del módulo Periodontograma. Maneja el historial de controles
 * periodontales por paciente, con múltiples controles y persistencia
 * directa en localStorage.
 *
 * Dependencias testeadas:
 * - crearPiezaVaciaSchema, crearControlPeriodontalSchema (schemas)
 * - sanitizarSondaje, sanitizarRecesion (validación)
 * - calcularEstadisticasPeriodontales, generarResumenClinico, estructurarDatosParaGrafico (cálculos)
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePeriodontograma } from './usePeriodontograma'
import { crearControlPeriodontalSchema } from '../schemas/periodontalSchema'
import { sanitizarSondaje, sanitizarRecesion } from '../utils/periodontalValidation'
import {
  calcularEstadisticasPeriodontales,
  generarResumenClinico,
  estructurarDatosParaGrafico
} from '../utils/periodontalCalculations'

// Mockear las funciones de schemas
vi.mock('../schemas/periodontalSchema', () => ({
  crearPiezaVaciaSchema: vi.fn(() => ({
    sondaje: {},
    recesion: {},
    sangrado: {},
    placa: {},
    ausente: false,
    implante: false
  })),
  crearControlPeriodontalSchema: vi.fn((id = 1, observacion = '') => ({
    id,
    fecha: new Date().toISOString(),
    observacion,
    piezas: {}
  }))
}))

// Mockear las funciones de validación
vi.mock('../utils/periodontalValidation', () => ({
  sanitizarSondaje: vi.fn((v) => v),
  sanitizarRecesion: vi.fn((v) => v)
}))

// Mockear las funciones de cálculo
vi.mock('../utils/periodontalCalculations', () => ({
  calcularEstadisticasPeriodontales: vi.fn(() => ({
    sitiosTotales: 0,
    sitiosSanos: 0,
    sitiosConSondaje: 0
  })),
  generarResumenClinico: vi.fn(() => ({
    diagnostico: 'Periodonto sano',
    recomendaciones: []
  })),
  estructurarDatosParaGrafico: vi.fn(() => ({
    labels: [],
    datasets: []
  }))
}))

describe('usePeriodontograma', () => {
  const pacienteId = 123
  const storageKey = `periodonto_historial_${pacienteId}`

  beforeEach(() => {
    vi.clearAllMocks()
    // Limpiar localStorage antes de cada test
    window.localStorage.clear()
  })

  describe('Inicialización', () => {
    it('crea control inicial si no existe historial en localStorage', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      expect(crearControlPeriodontalSchema).toHaveBeenCalled()
      expect(result.current.historialControles).toHaveLength(1)
      expect(result.current.controlActivoId).toBe(1)
    })

    it('carga historial existente desde localStorage', () => {
      const historialExistente = [
        { id: 10, fecha: '2026-08-01', observacion: 'Control previo', piezas: {} },
        { id: 11, fecha: '2026-08-10', observacion: 'Control reciente', piezas: {} }
      ]
      window.localStorage.setItem(storageKey, JSON.stringify(historialExistente))

      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      expect(result.current.historialControles).toHaveLength(2)
      expect(result.current.historialControles[0].id).toBe(10)
    })

    it('maneja JSON corrupto en localStorage sin romper', () => {
      window.localStorage.setItem(storageKey, '{json-corrupto{{')

      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      // Debe retornar control inicial sin lanzar error
      expect(result.current.historialControles).toHaveLength(1)
      expect(result.current.controlActivoId).toBe(1)
    })

    it('maneja datos no-array en localStorage retornando control inicial', () => {
      window.localStorage.setItem(storageKey, JSON.stringify({ noEs: 'un array' }))

      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      expect(result.current.historialControles).toHaveLength(1)
    })
  })

  describe('Control activo', () => {
    it('controlActivo retorna el control con el ID activo', () => {
      const historialExistente = [
        { id: 10, fecha: '2026-08-01', observacion: 'Control 1', piezas: {} },
        { id: 11, fecha: '2026-08-10', observacion: 'Control 2', piezas: {} }
      ]
      window.localStorage.setItem(storageKey, JSON.stringify(historialExistente))

      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      // Por defecto el control activo es el primero del historial
      expect(result.current.controlActivoId).toBe(10)
    })

    it('datosPeriodontales retorna las piezas del control activo', () => {
      const piezasMock = {
        '1.1': { sondaje: { mesial: 3 }, recesion: {}, ausente: false, implante: false }
      }
      const historialExistente = [
        { id: 10, fecha: '2026-08-01', observacion: '', piezas: piezasMock }
      ]
      window.localStorage.setItem(storageKey, JSON.stringify(historialExistente))

      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      expect(result.current.datosPeriodontales).toEqual(piezasMock)
    })
  })

  describe('Cálculos memoizados', () => {
    it('metricas se calcula con calcularEstadisticasPeriodontales', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      expect(calcularEstadisticasPeriodontales).toHaveBeenCalledWith(result.current.datosPeriodontales)
      expect(result.current.metricas).toEqual({
        sitiosTotales: 0,
        sitiosSanos: 0,
        sitiosConSondaje: 0
      })
    })

    it('resumenClinico se calcula con generarResumenClinico', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      expect(generarResumenClinico).toHaveBeenCalled()
      expect(result.current.resumenClinico).toEqual({
        diagnostico: 'Periodonto sano',
        recomendaciones: []
      })
    })

    it('datosGrafico se calcula con estructurarDatosParaGrafico', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      expect(estructurarDatosParaGrafico).toHaveBeenCalledWith(result.current.datosPeriodontales)
      expect(result.current.datosGrafico).toEqual({
        labels: [],
        datasets: []
      })
    })
  })

  describe('actualizarSondaje', () => {
    it('actualiza el sondaje de una pieza y sitio específico', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.actualizarSondaje('1.1', 'mesial', 4)
      })

      expect(result.current.datosPeriodontales['1.1'].sondaje.mesial).toBe(4)
    })

    it('llama a sanitizarSondaje con el valor raw', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.actualizarSondaje('1.1', 'mesial', 5)
      })

      expect(sanitizarSondaje).toHaveBeenCalledWith(5)
    })
  })

  describe('actualizarRecesion', () => {
    it('actualiza la recesión de una pieza y sitio específico', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.actualizarRecesion('1.1', 'vestibular', 2)
      })

      expect(result.current.datosPeriodontales['1.1'].recesion.vestibular).toBe(2)
    })

    it('llama a sanitizarRecesion con el valor raw', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.actualizarRecesion('1.1', 'vestibular', 3)
      })

      expect(sanitizarRecesion).toHaveBeenCalledWith(3)
    })
  })

  describe('toggleFlagSitio', () => {
    it('togglea un flag de sitio de undefined a true', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.toggleFlagSitio('1.1', 'sangrado', 'mesial')
      })

      expect(result.current.datosPeriodontales['1.1'].sangrado.mesial).toBe(true)
    })

    it('togglea un flag de sitio de true a false', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.toggleFlagSitio('1.1', 'sangrado', 'mesial')
      })
      expect(result.current.datosPeriodontales['1.1'].sangrado.mesial).toBe(true)

      act(() => {
        result.current.toggleFlagSitio('1.1', 'sangrado', 'mesial')
      })
      expect(result.current.datosPeriodontales['1.1'].sangrado.mesial).toBe(false)
    })
  })

  describe('Toggles y atributos globales de pieza', () => {
    it('togglePiezaAusente togglea el flag de pieza ausente', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.togglePiezaAusente('1.1')
      })

      expect(result.current.datosPeriodontales['1.1'].ausente).toBe(true)
    })

    it('togglePiezaImplante togglea el flag de pieza implante', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.togglePiezaImplante('1.1')
      })

      expect(result.current.datosPeriodontales['1.1'].implante).toBe(true)
    })

    it('actualizarAtributoGlobalPieza actualiza un atributo específico', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      act(() => {
        result.current.actualizarAtributoGlobalPieza('1.1', 'movilidad', 2)
      })

      expect(result.current.datosPeriodontales['1.1'].movilidad).toBe(2)
    })
  })

  describe('crearNuevoControl y persistencia', () => {
    it('crea un nuevo control y lo agrega al inicio del historial', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      const historialInicial = result.current.historialControles.length

      act(() => {
        result.current.crearNuevoControl('Control de seguimiento')
      })

      expect(result.current.historialControles).toHaveLength(historialInicial + 1)
      expect(crearControlPeriodontalSchema).toHaveBeenCalledWith(expect.any(Number), 'Control de seguimiento')
    })

    it('establece el nuevo control como activo', () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      const idAnterior = result.current.controlActivoId

      act(() => {
        result.current.crearNuevoControl('Nuevo control')
      })

      expect(result.current.controlActivoId).not.toBe(idAnterior)
      expect(result.current.controlActivoId).toBe(result.current.historialControles[0].id)
    })

    it('persiste cambios en localStorage con la clave correcta', async () => {
      const { result } = renderHook(() => usePeriodontograma(pacienteId))

      await act(async () => {
        result.current.actualizarSondaje('1.1', 'mesial', 3)
      })

      // F6-D-3: guardarHistorialControles ahora es async, esperar a que se resuelva
      await new Promise(resolve => setTimeout(resolve, 0))

      const storedData = window.localStorage.getItem(storageKey)
      expect(storedData).toBeTruthy()

      const parsedData = JSON.parse(storedData)
      expect(Array.isArray(parsedData)).toBe(true)
      expect(parsedData.length).toBeGreaterThanOrEqual(1)
    })
  })
})