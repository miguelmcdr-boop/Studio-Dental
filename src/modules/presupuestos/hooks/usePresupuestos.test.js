import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePresupuestos } from './usePresupuestos'
import { presupuestosStorageService } from '../services/presupuestosStorageService'
import { calcularResumenPresupuestos } from '../utils/presupuestosCalculations'

vi.mock('../services/presupuestosStorageService', () => ({
  presupuestosStorageService: {
    obtenerPresupuestos: vi.fn(),
    consolidarPresupuestosDesdePacientes: vi.fn(),
    guardarPresupuestos: vi.fn(),
    actualizarEstadoPresupuesto: vi.fn(),
    eliminarPresupuestoYFicha: vi.fn()
  }
}))

vi.mock('../utils/presupuestosCalculations', () => ({
  calcularResumenPresupuestos: vi.fn()
}))

describe('usePresupuestos', () => {
  const mockPacientes = [
    { id: 1, nombre: 'Ana García', rut: '12.345.678-9' },
    { id: 2, nombre: 'Carlos Ruiz', rut: '11.222.333-4' }
  ]

  const mockPresupuestosDirectos = [
    { id: 1, folio: 'P-001', pacienteNombre: 'Juan Pérez', pacienteRut: '12.345.678-9', estado: 'Pendiente', total: 50000 }
  ]

  const mockPresupuestosPacientes = [
    { id: 2, folio: 'P-002', pacienteNombre: 'Ana García', pacienteRut: '12.345.678-9', estado: 'Aprobado', total: 75000 },
    { id: 3, folio: 'P-003', pacienteNombre: 'Carlos Ruiz', pacienteRut: '11.222.333-4', estado: 'Rechazado', total: 30000 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    presupuestosStorageService.obtenerPresupuestos.mockReturnValue(mockPresupuestosDirectos)
    presupuestosStorageService.consolidarPresupuestosDesdePacientes.mockReturnValue(mockPresupuestosPacientes)
    presupuestosStorageService.guardarPresupuestos.mockImplementation(() => {})
    presupuestosStorageService.actualizarEstadoPresupuesto.mockImplementation(() => {})
    presupuestosStorageService.eliminarPresupuestoYFicha.mockImplementation(() => {})
    
    calcularResumenPresupuestos.mockReturnValue({
      total: 3,
      pendientes: 1,
      aprobados: 1,
      rechazados: 1,
      montoTotal: 155000
    })
    
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  describe('Inicialización', () => {
    it('carga presupuestos al montar', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      expect(presupuestosStorageService.obtenerPresupuestos).toHaveBeenCalledWith([])
      expect(presupuestosStorageService.consolidarPresupuestosDesdePacientes).toHaveBeenCalledWith(mockPacientes)
      expect(result.current.presupuestos).toBeDefined()
    })

    it('fusiona presupuestos directos y de pacientes sin duplicados', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      // Debe tener 3 presupuestos únicos (1 directo + 2 de pacientes)
      expect(result.current.presupuestos).toHaveLength(3)
      // El orden depende del Map: pacientes primero (2, 3), luego directos (1)
      expect(result.current.presupuestos.map(p => p.id)).toEqual([2, 3, 1])
    })

    it('inicializa estado de filtros con valores por defecto', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      expect(result.current.estadoFiltro).toBe('Todos')
      expect(result.current.busqueda).toBe('')
      expect(result.current.modalNuevoAbierto).toBe(false)
      expect(result.current.presupuestoImprimir).toBe(null)
    })

    it('calcula resumen basado en presupuestos cargados', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      expect(calcularResumenPresupuestos).toHaveBeenCalledWith(expect.any(Array))
      expect(result.current.resumen).toEqual({
        total: 3,
        pendientes: 1,
        aprobados: 1,
        rechazados: 1,
        montoTotal: 155000
      })
    })
  })

  describe('Deduplicación por ID', () => {
    it('presupuesto directo sobrescribe presupuesto de paciente con mismo ID', () => {
      const presupuestoDirectoDuplicado = { id: 2, folio: 'P-002-DIRECTO', pacienteNombre: 'Ana García', estado: 'Pendiente', total: 100000 }
      presupuestosStorageService.obtenerPresupuestos.mockReturnValue([presupuestoDirectoDuplicado])

      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      // Debe tener 2 presupuestos únicos (ID 2 directo sobrescribe al del paciente, ID 3 queda)
      expect(result.current.presupuestos).toHaveLength(2)
      const presupuestoId2 = result.current.presupuestos.find(p => p.id === 2)
      expect(presupuestoId2.folio).toBe('P-002-DIRECTO')
      expect(presupuestoId2.total).toBe(100000)
    })
  })

  describe('Filtrado de presupuestos', () => {
    it('filtra por estado', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.setEstadoFiltro('Aprobado')
      })

      expect(result.current.presupuestos).toHaveLength(1)
      expect(result.current.presupuestos[0].estado).toBe('Aprobado')
    })

    it('filtra por búsqueda en folio', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.setBusqueda('P-001')
      })

      expect(result.current.presupuestos).toHaveLength(1)
      expect(result.current.presupuestos[0].folio).toBe('P-001')
    })

    it('filtra por búsqueda en nombre de paciente', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.setBusqueda('ana')
      })

      expect(result.current.presupuestos).toHaveLength(1)
      expect(result.current.presupuestos[0].pacienteNombre).toBe('Ana García')
    })

    it('filtra por búsqueda en RUT', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.setBusqueda('11.222')
      })

      expect(result.current.presupuestos).toHaveLength(1)
      expect(result.current.presupuestos[0].pacienteRut).toBe('11.222.333-4')
    })

    it('combina filtro de estado y búsqueda', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.setEstadoFiltro('Pendiente')
        result.current.setBusqueda('juan')
      })

      expect(result.current.presupuestos).toHaveLength(1)
      expect(result.current.presupuestos[0].pacienteNombre).toBe('Juan Pérez')
    })

    it('retorna array vacío si no hay coincidencias', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.setBusqueda('xyz')
      })

      expect(result.current.presupuestos).toHaveLength(0)
    })
  })

  describe('agregarPresupuesto', () => {
    it('agrega presupuesto al inicio del array', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))
      const nuevoPresupuesto = { id: 100, folio: 'P-100', pacienteNombre: 'Nuevo', estado: 'Pendiente', total: 50000 }

      act(() => {
        result.current.agregarPresupuesto(nuevoPresupuesto)
      })

      expect(presupuestosStorageService.guardarPresupuestos).toHaveBeenCalled()
      const savedPresupuestos = presupuestosStorageService.guardarPresupuestos.mock.calls[0][0]
      expect(savedPresupuestos[0].id).toBe(100)
    })

    it('recarga presupuestos después de agregar', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))
      const nuevoPresupuesto = { id: 100, folio: 'P-100', estado: 'Pendiente' }

      act(() => {
        result.current.agregarPresupuesto(nuevoPresupuesto)
      })

      // 1 llamada inicial + 1 en agregarPresupuesto + 1 en cargarPresupuestos = 3 llamadas
      expect(presupuestosStorageService.obtenerPresupuestos).toHaveBeenCalledTimes(3)
    })
  })

  describe('cambiarEstadoPresupuesto', () => {
    it('actualiza estado de un presupuesto', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.cambiarEstadoPresupuesto(1, 'Aprobado')
      })

      expect(presupuestosStorageService.actualizarEstadoPresupuesto).toHaveBeenCalledWith(1, 'Aprobado')
    })

    it('recarga presupuestos después de cambiar estado', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.cambiarEstadoPresupuesto(1, 'Aprobado')
      })

      expect(presupuestosStorageService.obtenerPresupuestos).toHaveBeenCalledTimes(2)
    })
  })

  describe('eliminarPresupuesto', () => {
    it('elimina presupuesto si usuario confirma', () => {
      window.confirm.mockReturnValue(true)
      const { result } = renderHook(() => usePresupuestos(mockPacientes))
      const items = [{ id: 1, descripcion: 'Item 1' }]

      act(() => {
        result.current.eliminarPresupuesto(1, 1, items)
      })

      expect(presupuestosStorageService.eliminarPresupuestoYFicha).toHaveBeenCalledWith(1, 1, items)
    })

    it('no elimina si usuario cancela', () => {
      window.confirm.mockReturnValue(false)
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.eliminarPresupuesto(1, 1, [])
      })

      expect(presupuestosStorageService.eliminarPresupuestoYFicha).not.toHaveBeenCalled()
    })

    it('recarga presupuestos después de eliminar', () => {
      window.confirm.mockReturnValue(true)
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      act(() => {
        result.current.eliminarPresupuesto(1, 1, [])
      })

      expect(presupuestosStorageService.obtenerPresupuestos).toHaveBeenCalledTimes(2)
    })
  })

  describe('Listeners de eventos', () => {
    it('registra listeners de storage y presupuestos_actualizados al montar', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      renderHook(() => usePresupuestos(mockPacientes))

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('presupuestos_actualizados', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('desregistra listeners al desmontar', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderHook(() => usePresupuestos(mockPacientes))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('presupuestos_actualizados', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('recarga presupuestos cuando se dispara evento storage', () => {
      renderHook(() => usePresupuestos(mockPacientes))

      const llamadasIniciales = presupuestosStorageService.obtenerPresupuestos.mock.calls.length

      act(() => {
        window.dispatchEvent(new Event('storage'))
      })

      expect(presupuestosStorageService.obtenerPresupuestos.mock.calls.length).toBeGreaterThan(llamadasIniciales)
    })

    it('recarga presupuestos cuando se dispara evento presupuestos_actualizados', () => {
      renderHook(() => usePresupuestos(mockPacientes))

      const llamadasIniciales = presupuestosStorageService.obtenerPresupuestos.mock.calls.length

      act(() => {
        window.dispatchEvent(new Event('presupuestos_actualizados'))
      })

      expect(presupuestosStorageService.obtenerPresupuestos.mock.calls.length).toBeGreaterThan(llamadasIniciales)
    })
  })
})