import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePresupuestos } from './usePresupuestos'
import { presupuestosStorageService } from '../services/presupuestosStorageService'
import { calcularResumenPresupuestos } from '../utils/presupuestosCalculations'
import { useDialogStore } from '../../../store/dialogStore'

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

  // Fix F10-C3.12: todos los presupuestos son directos (no hay consolidados virtuales)
  const mockPresupuestosDirectos = [
    { id: 1, folio: 'P-001', pacienteNombre: 'Juan Pérez', pacienteRut: '12.345.678-9', estado: 'Pendiente', total: 50000 },
    { id: 2, folio: 'P-002', pacienteNombre: 'Ana García', pacienteRut: '12.345.678-9', estado: 'Aprobado', total: 75000 },
    { id: 3, folio: 'P-003', pacienteNombre: 'Carlos Ruiz', pacienteRut: '11.222.333-4', estado: 'Rechazado', total: 30000 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    presupuestosStorageService.obtenerPresupuestos.mockReturnValue(mockPresupuestosDirectos)
    // Fix F10-C3.12: ya no se llama a consolidarPresupuestosDesdePacientes
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
    
    useDialogStore.setState({ dialog: null })
  })

  describe('Inicialización', () => {
    it('carga presupuestos al montar', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      expect(presupuestosStorageService.obtenerPresupuestos).toHaveBeenCalledWith([])
      // Fix F10-C3.12: ya no se llama a consolidarPresupuestosDesdePacientes
      expect(presupuestosStorageService.consolidarPresupuestosDesdePacientes).not.toHaveBeenCalled()
      expect(result.current.presupuestos).toBeDefined()
    })

    it('carga todos los presupuestos directos sin consolidados virtuales', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      // Fix F10-C3.12: solo presupuestos directos, no consolidados
      expect(result.current.presupuestos).toHaveLength(3)
      expect(result.current.presupuestos.map(p => p.id)).toEqual([1, 2, 3])
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

  describe('IDs únicos', () => {
    it('cada presupuesto directo tiene ID único sin conflictos', () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      // Fix F10-C3.12: todos son presupuestos directos con IDs únicos
      expect(result.current.presupuestos).toHaveLength(3)
      const ids = result.current.presupuestos.map(p => p.id)
      expect(new Set(ids).size).toBe(3) // Todos únicos
      expect(ids).toEqual([1, 2, 3])
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
    it('elimina presupuesto si usuario confirma', async () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))
      const items = [{ id: 1, descripcion: 'Item 1' }]

      await act(async () => {
        const promise = result.current.eliminarPresupuesto(1, 1, items)
        // F10-C3.5: verificar que el diálogo se abrió
        expect(useDialogStore.getState().dialog).not.toBeNull()
        expect(useDialogStore.getState().dialog.title).toBe('Eliminar presupuesto')
        expect(useDialogStore.getState().dialog.variant).toBe('danger')
        // Resolver con true (confirmar)
        useDialogStore.getState().closeDialog(true)
        await promise
      })

      expect(presupuestosStorageService.eliminarPresupuestoYFicha).toHaveBeenCalledWith(1, 1, items)
    })

    it('no elimina si usuario cancela', async () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      await act(async () => {
        const promise = result.current.eliminarPresupuesto(1, 1, [])
        // F10-C3.5: resolver con false (cancelar)
        useDialogStore.getState().closeDialog(false)
        await promise
      })

      expect(presupuestosStorageService.eliminarPresupuestoYFicha).not.toHaveBeenCalled()
    })

    it('recarga presupuestos después de eliminar', async () => {
      const { result } = renderHook(() => usePresupuestos(mockPacientes))

      await act(async () => {
        const promise = result.current.eliminarPresupuesto(1, 1, [])
        // F10-C3.5: resolver el diálogo con true (confirmar)
        useDialogStore.getState().closeDialog(true)
        await promise
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

  it('no incluye presupuestos consolidados virtuales (PRES-PAC-*) en la lista global', () => {
    // Fix F10-C3.12: los consolidados quedan solo en Ficha Clínica
    presupuestosStorageService.obtenerPresupuestos.mockReturnValue([
      { id: 1, folio: 'PRES-2026-001', pacienteNombre: 'Test' }
    ])

    const { result } = renderHook(() => usePresupuestos(mockPacientes))

    expect(result.current.presupuestos).toHaveLength(1)
    expect(presupuestosStorageService.consolidarPresupuestosDesdePacientes).not.toHaveBeenCalled()
  })
})
