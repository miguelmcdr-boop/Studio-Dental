import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFichaPaciente } from './useFichaPaciente'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { odontogramaStorageService } from '../../odontograma/services/odontogramaStorageService'

describe('useFichaPaciente', () => {
  const pacienteMock = {
    id: 123,
    nombre: 'Juan Pérez',
    motivoConsulta: 'Dolor molar',
    alergias: 'Penicilina'
  }

  const alActualizarPacienteMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(pacientesStorageService, 'obtenerItem').mockImplementation((key, defaultValue) => defaultValue)
    vi.spyOn(pacientesStorageService, 'guardarItem').mockImplementation(() => {})
    // F6-D-2: mock del nuevo servicio de odontogramas
    vi.spyOn(odontogramaStorageService, 'obtenerOdontogramaInicial').mockImplementation((id, fallback) => fallback)
    vi.spyOn(odontogramaStorageService, 'obtenerOdontogramaEvolucion').mockImplementation((id, fallback) => fallback)
    vi.spyOn(odontogramaStorageService, 'guardarOdontogramaInicial').mockResolvedValue(true)
    vi.spyOn(odontogramaStorageService, 'guardarOdontogramaEvolucion').mockResolvedValue(true)
  })

  describe('Inicialización', () => {
    it('inicializa con tabActiva en "Ficha Clínica"', () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )
      expect(result.current.tabActiva).toBe('Ficha Clínica')
    })

    it('carga datos de ficha desde el paciente', () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )
      
      expect(result.current.fichaData.motivoConsulta).toBe('Dolor molar')
      expect(result.current.fichaData.alergias).toBe('Penicilina')
      expect(result.current.fichaData.riesgoCariogenico).toBe('Bajo')
      expect(result.current.fichaData.riesgoPeriodontal).toBe('Gingivitis')
    })

    it('carga odontogramas desde storage con claves correctas', () => {
      const odontoInicial = { 18: 'obturado' }
      const odontoEvolucion = { 18: 'corona' }
      
      // F6-D-2: ahora usa odontogramaStorageService
      vi.spyOn(odontogramaStorageService, 'obtenerOdontogramaInicial').mockReturnValue(odontoInicial)
      vi.spyOn(odontogramaStorageService, 'obtenerOdontogramaEvolucion').mockReturnValue(odontoEvolucion)

      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      expect(odontogramaStorageService.obtenerOdontogramaInicial).toHaveBeenCalledWith(123, {})
      expect(odontogramaStorageService.obtenerOdontogramaEvolucion).toHaveBeenCalledWith(123, {})
      expect(result.current.odontogramaInicial).toEqual(odontoInicial)
      expect(result.current.odontogramaEvolucion).toEqual(odontoEvolucion)
    })

    it('carga items de presupuesto, abonos y notas desde storage', () => {
      const items = [{ id: 1, valor: 10000 }]
      const abonos = [{ id: 1, monto: 5000 }]
      
      vi.spyOn(pacientesStorageService, 'obtenerItem').mockImplementation((key) => {
        if (key === 'presupuesto_items_123') return items
        if (key === 'abonos_123') return abonos
        return []
      })

      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      expect(result.current.itemsPresupuesto).toEqual(items)
      expect(result.current.abonos).toEqual(abonos)
    })
  })

  describe('Cálculos de totales', () => {
    it('calcula totalPresupuesto sumando valor de items', () => {
      vi.spyOn(pacientesStorageService, 'obtenerItem').mockImplementation((key) => {
        if (key === 'presupuesto_items_123') {
          return [
            { id: 1, valor: 10000 },
            { id: 2, valor: 15000 }
          ]
        }
        return []
      })

      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      expect(result.current.totalPresupuesto).toBe(25000)
    })

    it('calcula totalAbonado sumando monto de abonos', () => {
      vi.spyOn(pacientesStorageService, 'obtenerItem').mockImplementation((key) => {
        if (key === 'abonos_123') {
          return [
            { id: 1, monto: 5000 },
            { id: 2, monto: 3000 }
          ]
        }
        return []
      })

      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      expect(result.current.totalAbonado).toBe(8000)
    })

    it('calcula saldoPendiente como diferencia', () => {
      vi.spyOn(pacientesStorageService, 'obtenerItem').mockImplementation((key) => {
        if (key === 'presupuesto_items_123') return [{ id: 1, valor: 25000 }]
        if (key === 'abonos_123') return [{ id: 1, monto: 8000 }]
        return []
      })

      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      expect(result.current.saldoPendiente).toBe(17000)
    })

    it('maneja arrays vacíos correctamente', () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      expect(result.current.totalPresupuesto).toBe(0)
      expect(result.current.totalAbonado).toBe(0)
      expect(result.current.saldoPendiente).toBe(0)
    })

    it('maneja items sin campo valor', () => {
      vi.spyOn(pacientesStorageService, 'obtenerItem').mockImplementation((key) => {
        if (key === 'presupuesto_items_123') {
          return [{ id: 1 }, { id: 2, valor: 10000 }]
        }
        return []
      })

      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      expect(result.current.totalPresupuesto).toBe(10000)
    })
  })

  describe('handleFichaChange', () => {
    it('actualiza un campo específico de la ficha', () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      act(() => {
        result.current.handleFichaChange('motivoConsulta', 'Control de rutina')
      })

      expect(result.current.fichaData.motivoConsulta).toBe('Control de rutina')
    })

    it('llama a alActualizarPaciente con datos completos', () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      act(() => {
        result.current.handleFichaChange('alergias', 'Ninguna')
      })

      expect(alActualizarPacienteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 123,
          nombre: 'Juan Pérez',
          alergias: 'Ninguna',
          motivoConsulta: 'Dolor molar'
        })
      )
    })

    it('preserva otros campos al actualizar uno', () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      act(() => {
        result.current.handleFichaChange('enfermedades', 'Diabetes')
      })

      expect(result.current.fichaData.motivoConsulta).toBe('Dolor molar')
      expect(result.current.fichaData.alergias).toBe('Penicilina')
      expect(result.current.fichaData.enfermedades).toBe('Diabetes')
    })
  })

  describe('guardarInicial y guardarEvolucion', () => {
    it('guardarInicial actualiza estado y persiste', async () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      const nuevoOdonto = { 18: 'obturado', 19: 'sano' }

      await act(async () => {
        await result.current.guardarInicial(nuevoOdonto)
      })

      expect(result.current.odontogramaInicial).toEqual(nuevoOdonto)
      // F6-D-2: ahora usa odontogramaStorageService
      expect(odontogramaStorageService.guardarOdontogramaInicial).toHaveBeenCalledWith(
        123,
        nuevoOdonto
      )
    })

    it('guardarEvolucion actualiza estado y persiste', async () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      const nuevoOdonto = { 18: 'corona' }

      await act(async () => {
        await result.current.guardarEvolucion(nuevoOdonto)
      })

      expect(result.current.odontogramaEvolucion).toEqual(nuevoOdonto)
      // F6-D-2: ahora usa odontogramaStorageService
      expect(odontogramaStorageService.guardarOdontogramaEvolucion).toHaveBeenCalledWith(
        123,
        nuevoOdonto
      )
    })
  })

  describe('Cambio de tab', () => {
    it('cambia la tab activa correctamente', () => {
      const { result } = renderHook(() => 
        useFichaPaciente(pacienteMock, alActualizarPacienteMock)
      )

      act(() => {
        result.current.setTabActiva('Presupuesto')
      })

      expect(result.current.tabActiva).toBe('Presupuesto')
    })
  })
})