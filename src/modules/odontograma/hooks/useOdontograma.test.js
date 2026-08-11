/**
 * Tests de integración para useOdontograma (F3-04)
 *
 * Hook del módulo Odontograma. Maneja el estado de 32 piezas dentales
 * con múltiples estados por cara, cálculo del índice CPOD (OMS),
 * y delegación de persistencia vía guardarCallback.
 *
 * IMPORTANTE: Los objetos odontogramaInicial se crean FUERA del callback
 * de renderHook para mantener referencia estable y evitar re-renders
 * infinitos con el useEffect que sincroniza el estado.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOdontograma } from './useOdontograma'

describe('useOdontograma', () => {
  let guardarCallback
  let odontoVacio

  beforeEach(() => {
    guardarCallback = vi.fn()
    odontoVacio = {} // Referencia estable para evitar loop infinito
  })

  describe('Inicialización', () => {
    it('inicializa con estado por defecto (permanente, caries, pieza 1.8)', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      expect(result.current.odontograma).toEqual({})
      expect(result.current.tipoDenticion).toBe('permanente')
      expect(result.current.modoSeleccionado).toBe('caries')
      expect(result.current.piezaActiva).toBe('1.8')
      expect(result.current.modoComparativoSplit).toBe(false)
    })

    it('carga odontograma inicial via prop', () => {
      const odontoInicial = {
        '1.8': { general: 'caries', caras: {}, observacion: '' }
      }
      const { result } = renderHook(() => useOdontograma(odontoInicial, guardarCallback))

      expect(result.current.odontograma).toEqual(odontoInicial)
    })

    it('sincroniza cuando cambia odontogramaInicial (useEffect)', () => {
      const odontoInicial = {}
      const { result, rerender } = renderHook(
        ({ odonto }) => useOdontograma(odonto, guardarCallback),
        { initialProps: { odonto: odontoInicial } }
      )

      const nuevoOdonto = { '2.1': { general: 'sano', caras: {}, observacion: '' } }
      rerender({ odonto: nuevoOdonto })

      expect(result.current.odontograma).toEqual(nuevoOdonto)
    })
  })

  describe('cpodStats (integración con calcularIndiceCPOD)', () => {
    it('retorna stats vacías con odontograma vacío', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      expect(result.current.cpodStats.cariados).toBe(0)
      expect(result.current.cpodStats.perdidos).toBe(0)
      expect(result.current.cpodStats.obturados).toBe(0)
      expect(result.current.cpodStats.sanos).toBe(0)
      expect(result.current.cpodStats.cpodTotal).toBe(0)
      expect(result.current.cpodStats.nivelRiesgoOMS).toBe('Muy Bajo')
    })

    it('calcula stats correctamente con piezas en diferentes estados', () => {
      const odonto = {
        '1.8': { general: 'caries', caras: {}, observacion: '' },
        '1.7': { general: 'ausente', caras: {}, observacion: '' },
        '1.6': { general: 'restauracion', caras: {}, observacion: '' },
        '1.5': { general: 'sano', caras: {}, observacion: '' }
      }
      const { result } = renderHook(() => useOdontograma(odonto, guardarCallback))

      expect(result.current.cpodStats.cariados).toBe(1)
      expect(result.current.cpodStats.perdidos).toBe(1)
      expect(result.current.cpodStats.obturados).toBe(1)
      expect(result.current.cpodStats.sanos).toBe(1)
      expect(result.current.cpodStats.cpodTotal).toBe(3)
    })
  })

  describe('handleCaraClick', () => {
    it('marca una cara con el modo especificado', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      act(() => {
        result.current.handleCaraClick('1.8', 'mesial', 'caries')
      })

      expect(result.current.odontograma['1.8'].caras.mesial).toBe('caries')
      expect(result.current.odontograma['1.8'].general).toBe('sano')
    })

    it('toggle: segunda vez en la misma cara vuelve a sano', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      act(() => {
        result.current.handleCaraClick('1.8', 'mesial', 'caries')
      })
      expect(result.current.odontograma['1.8'].caras.mesial).toBe('caries')

      act(() => {
        result.current.handleCaraClick('1.8', 'mesial', 'caries')
      })
      expect(result.current.odontograma['1.8'].caras.mesial).toBe('sano')
    })

    it('cambia piezaActiva al hacer clic en una pieza', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      expect(result.current.piezaActiva).toBe('1.8')

      act(() => {
        result.current.handleCaraClick('2.3', 'distal', 'caries')
      })

      expect(result.current.piezaActiva).toBe('2.3')
    })

    it('llama a guardarCallback con el estado nuevo', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      act(() => {
        result.current.handleCaraClick('1.8', 'mesial', 'caries')
      })

      expect(guardarCallback).toHaveBeenCalledTimes(1)
      expect(guardarCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          '1.8': expect.objectContaining({
            caras: expect.objectContaining({ mesial: 'caries' })
          })
        })
      )
    })
  })

  describe('handleEstadoGeneral', () => {
    it('establece estado general de la pieza activa', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      act(() => {
        result.current.handleEstadoGeneral('caries')
      })

      expect(result.current.odontograma['1.8'].general).toBe('caries')
    })

    it('resetea las caras individuales al establecer estado general', () => {
      const odontoInicial = {
        '1.8': {
          general: 'sano',
          caras: { mesial: 'caries', distal: 'restauracion' },
          observacion: ''
        }
      }
      const { result } = renderHook(() => useOdontograma(odontoInicial, guardarCallback))

      act(() => {
        result.current.handleEstadoGeneral('ausente')
      })

      expect(result.current.odontograma['1.8'].general).toBe('ausente')
      expect(result.current.odontograma['1.8'].caras).toEqual({})
    })

    it('no hace nada si no hay piezaActiva (guard clause)', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      act(() => {
        result.current.setPiezaActiva(null)
      })

      act(() => {
        result.current.handleEstadoGeneral('caries')
      })

      expect(guardarCallback).not.toHaveBeenCalled()
    })
  })

  describe('handleLimpiarPieza', () => {
    it('resetea la pieza activa a sano completo', () => {
      const odontoInicial = {
        '1.8': {
          general: 'caries',
          caras: { mesial: 'caries' },
          observacion: 'Dolor severo'
        }
      }
      const { result } = renderHook(() => useOdontograma(odontoInicial, guardarCallback))

      act(() => {
        result.current.handleLimpiarPieza()
      })

      expect(result.current.odontograma['1.8']).toEqual({
        general: 'sano',
        caras: {},
        observacion: ''
      })
    })

    it('no hace nada si no hay piezaActiva (guard clause)', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      act(() => {
        result.current.setPiezaActiva(null)
      })

      act(() => {
        result.current.handleLimpiarPieza()
      })

      expect(guardarCallback).not.toHaveBeenCalled()
    })
  })

  describe('handleObservacionChange', () => {
    it('actualiza la observación de la pieza activa', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      act(() => {
        result.current.handleObservacionChange('Paciente refiere dolor')
      })

      expect(result.current.odontograma['1.8'].observacion).toBe('Paciente refiere dolor')
    })

    it('no hace nada si no hay piezaActiva (guard clause)', () => {
      const { result } = renderHook(() => useOdontograma(odontoVacio, guardarCallback))

      act(() => {
        result.current.setPiezaActiva(null)
      })

      act(() => {
        result.current.handleObservacionChange('Texto')
      })

      expect(guardarCallback).not.toHaveBeenCalled()
    })
  })
})