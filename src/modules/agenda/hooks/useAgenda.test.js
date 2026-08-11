/**
 * Tests de integración para useAgenda (F3-04)
 *
 * Hook crítico del módulo Agenda. Incluye test de regresión para F2-02b
 * (bug del "paciente exprés" que no aparecía en el resto de la app hasta
 * refrescar la página, por no pasar por usePacientesStore).
 *
 * Dependencias testeadas:
 * - agendaStorageService (persistencia de citas en localStorage)
 * - usePacientesStore (store Zustand global de pacientes)
 * - pacientesStorageService (indirectamente, vía el store)
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAgenda } from './useAgenda'
import { agendaStorageService } from '../services/agendaStorageService'
import { usePacientesStore } from '../../../store/pacientesStore'

describe('useAgenda', () => {
  beforeEach(() => {
    // Resetear el store global de pacientes a estado vacío entre tests.
    // Esto previene contaminación entre tests, ya que Zustand stores
    // son singletons compartidos entre todos los tests del proceso.
    usePacientesStore.setState({ pacientes: [] })

    // LIMPIEZA EXPLÍCITA de agendaStorageService.
    // Aunque el setup global limpia localStorage en afterEach, necesitamos
    // limpiar el servicio ANTES de cada test para evitar timing issues con
    // el useEffect que carga datos al montar el hook.
    agendaStorageService.guardarCitas([])

    // Restaurar cualquier mock previo (window.open, window.alert)
    vi.restoreAllMocks()
  })

  describe('inicialización', () => {
    it('inicializa con citas vacías, vista "box" y fecha de hoy por defecto', () => {
      const { result } = renderHook(() => useAgenda())

      expect(result.current.citas).toEqual([])
      expect(result.current.pacientes).toEqual([])
      expect(result.current.vista).toBe('box')
      expect(result.current.boxFiltro).toBe('Todos')
      expect(result.current.doctorFiltro).toBe('Todos')
      expect(result.current.modalNuevaCitaAbierto).toBe(false)
      expect(result.current.modalNuevoBloqueoAbierto).toBe(false)
      // Fecha en formato ISO local YYYY-MM-DD
      expect(result.current.fechaSeleccionada).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('carga citas pre-existentes desde agendaStorageService al montar', () => {
      const citasPrevias = [
        { id: 1, pacienteNombre: 'Paciente A', fecha: '2026-08-12' },
        { id: 2, pacienteNombre: 'Paciente B', fecha: '2026-08-13' }
      ]
      agendaStorageService.guardarCitas(citasPrevias)

      const { result } = renderHook(() => useAgenda())

      expect(result.current.citas).toHaveLength(2)
      expect(result.current.citas[0].pacienteNombre).toBe('Paciente A')
      expect(result.current.citas[1].pacienteNombre).toBe('Paciente B')
    })

    it('usa pacientesProp cuando se pasa como argumento', () => {
      const pacientesInyectados = [{ id: 99, nombre: 'Paciente Inyectado' }]
      const { result } = renderHook(() => useAgenda(pacientesInyectados))

      expect(result.current.pacientes).toHaveLength(1)
      expect(result.current.pacientes[0].nombre).toBe('Paciente Inyectado')
    })
  })

  describe('guardarCita', () => {
    it('guarda una cita nueva y la persiste en agendaStorageService', () => {
      const { result } = renderHook(() => useAgenda())

      const nuevaCita = {
        id: 100,
        pacienteId: 1,
        pacienteNombre: 'Juan Pérez',
        fecha: '2026-08-12',
        horaInicio: '10:00'
      }

      act(() => {
        result.current.guardarCita(nuevaCita, false)
      })

      // Estado local actualizado
      expect(result.current.citas).toHaveLength(1)
      expect(result.current.citas[0].id).toBe(100)
      expect(result.current.citas[0].pacienteNombre).toBe('Juan Pérez')

      // Persistencia verificada
      const citasPersistidas = agendaStorageService.obtenerCitas()
      expect(citasPersistidas).toHaveLength(1)
      expect(citasPersistidas[0].id).toBe(100)

      // NO debe crear paciente nuevo en el store global
      expect(usePacientesStore.getState().pacientes).toHaveLength(0)

      // Modales se cierran tras guardar
      expect(result.current.modalNuevaCitaAbierto).toBe(false)
      expect(result.current.modalNuevoBloqueoAbierto).toBe(false)
    })

    it('actualiza una cita existente en lugar de duplicarla', () => {
      const { result } = renderHook(() => useAgenda())

      const cita = { id: 100, pacienteNombre: 'Juan', fecha: '2026-08-12' }
      act(() => result.current.guardarCita(cita))
      expect(result.current.citas).toHaveLength(1)

      const citaActualizada = { ...cita, pacienteNombre: 'Juan Actualizado' }
      act(() => result.current.guardarCita(citaActualizada))

      expect(result.current.citas).toHaveLength(1)
      expect(result.current.citas[0].pacienteNombre).toBe('Juan Actualizado')
    })
  })

  describe('guardarCita con paciente exprés (regresión F2-02b)', () => {
    it('crea paciente nuevo y lo registra en usePacientesStore (no en storage directo)', () => {
      const { result } = renderHook(() => useAgenda())

      const citaExpress = {
        id: 200,
        pacienteId: 'express_temporal',
        pacienteNombre: 'María Express',
        pacienteTelefono: '+56 9 1234 5678',
        pacienteRut: '12.345.678-9',
        trataMiento: 'Control de rutina',
        fecha: '2026-08-12',
        horaInicio: '11:00'
      }

      act(() => {
        result.current.guardarCita(citaExpress, true)
      })

      // La cita se guardó con un pacienteId real (Date.now()), no 'express_'
      expect(result.current.citas).toHaveLength(1)
      expect(String(result.current.citas[0].pacienteId)).not.toMatch(/^express_/)
      expect(typeof result.current.citas[0].pacienteId).toBe('number')

      // CRÍTICO F2-02b: el paciente nuevo DEBE estar en el store global
      const pacientesEnStore = usePacientesStore.getState().pacientes
      expect(pacientesEnStore).toHaveLength(1)
      expect(pacientesEnStore[0].nombre).toBe('María Express')
      expect(pacientesEnStore[0].rut).toBe('12.345.678-9')
      expect(pacientesEnStore[0].telefono).toBe('+56 9 1234 5678')
      expect(pacientesEnStore[0].prevision).toBe('Particular')
      expect(pacientesEnStore[0].motivoConsulta).toBe('Control de rutina')

      // Y debe estar en la lista local del hook
      expect(result.current.pacientes).toHaveLength(1)
      expect(result.current.pacientes[0].nombre).toBe('María Express')

      // El pacienteId de la cita debe coincidir con el id del paciente creado
      expect(result.current.citas[0].pacienteId).toBe(pacientesEnStore[0].id)
    })

    it('agrega el paciente exprés al inicio del listado (más reciente primero)', () => {
      usePacientesStore.setState({
        pacientes: [{ id: 1, nombre: 'Paciente Existente', rut: '11.111.111-1' }]
      })

      const { result } = renderHook(() => useAgenda())

      const citaExpress = {
        id: 201,
        pacienteId: 'express_temporal',
        pacienteNombre: 'Nuevo Express',
        fecha: '2026-08-12'
      }

      act(() => result.current.guardarCita(citaExpress, true))

      const pacientesEnStore = usePacientesStore.getState().pacientes
      expect(pacientesEnStore).toHaveLength(2)
      expect(pacientesEnStore[0].nombre).toBe('Nuevo Express') // al inicio
      expect(pacientesEnStore[1].nombre).toBe('Paciente Existente') // después
    })

    it('NO crea paciente exprés si crearFichaSiExpress es false, aunque el id empiece con express_', () => {
      const { result } = renderHook(() => useAgenda())

      const cita = {
        id: 300,
        pacienteId: 'express_temporal',
        pacienteNombre: 'No Creado',
        fecha: '2026-08-12'
      }

      act(() => result.current.guardarCita(cita, false))

      expect(usePacientesStore.getState().pacientes).toHaveLength(0)
      
      // Buscar la cita específica por ID, no asumir posición en el array
      const citaGuardada = result.current.citas.find(c => c.id === 300)
      expect(citaGuardada).toBeDefined()
      expect(citaGuardada.pacienteId).toBe('express_temporal')
    })
  })

  describe('eliminarCita', () => {
    it('elimina una cita por ID y persiste el cambio', () => {
      const { result } = renderHook(() => useAgenda())

      act(() => {
        result.current.guardarCita({ id: 1, pacienteNombre: 'Cita 1' })
        result.current.guardarCita({ id: 2, pacienteNombre: 'Cita 2' })
      })
      expect(result.current.citas).toHaveLength(2)

      act(() => result.current.eliminarCita(1))

      expect(result.current.citas).toHaveLength(1)
      expect(result.current.citas[0].pacienteNombre).toBe('Cita 2')
      expect(agendaStorageService.obtenerCitas()).toHaveLength(1)
    })
  })

  describe('cambiarEstadoCita', () => {
    it('cambia el estado de una cita existente y lo persiste', () => {
      const { result } = renderHook(() => useAgenda())

      act(() => {
        result.current.guardarCita({ id: 1, pacienteNombre: 'Test', estado: 'Agendada' })
      })

      act(() => result.current.cambiarEstadoCita(1, 'Confirmado'))

      expect(result.current.citas[0].estado).toBe('Confirmado')
      expect(agendaStorageService.obtenerCitas()[0].estado).toBe('Confirmado')
    })

    it('agrega horaInicioAtencion cuando el estado es "En Sillón"', () => {
      const { result } = renderHook(() => useAgenda())

      act(() => {
        result.current.guardarCita({ id: 1, pacienteNombre: 'Test', estado: 'Agendada' })
      })

      const antes = Date.now()
      act(() => result.current.cambiarEstadoCita(1, 'En Sillón'))
      const despues = Date.now()

      const citaActualizada = result.current.citas[0]
      expect(citaActualizada.estado).toBe('En Sillón')
      expect(citaActualizada.horaInicioAtencion).toBeTruthy()
      expect(typeof citaActualizada.horaInicioAtencion).toBe('string')

      const timestamp = new Date(citaActualizada.horaInicioAtencion).getTime()
      expect(timestamp).toBeGreaterThanOrEqual(antes)
      expect(timestamp).toBeLessThanOrEqual(despues)
    })

    it('preserva horaInicioAtencion existente al cambiar a otros estados', () => {
      const { result } = renderHook(() => useAgenda())
      const horaPrevia = '2026-08-12T10:00:00.000Z'

      act(() => {
        result.current.guardarCita({
          id: 1,
          pacienteNombre: 'Test',
          estado: 'En Sillón',
          horaInicioAtencion: horaPrevia
        })
      })

      act(() => result.current.cambiarEstadoCita(1, 'Finalizada'))

      expect(result.current.citas[0].estado).toBe('Finalizada')
      expect(result.current.citas[0].horaInicioAtencion).toBe(horaPrevia)
    })
  })

  describe('enviarWhatsAppConfirmacion', () => {
    it('construye URL de WhatsApp con prefijo 56 para número chileno de 9 dígitos', () => {
      const { result } = renderHook(() => useAgenda())
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      act(() => {
        result.current.guardarCita({
          id: 1,
          pacienteNombre: 'Ana Test',
          pacienteTelefono: '912345678',
          fecha: '2026-08-15',
          horaInicio: '10:00',
          boxAsignado: 'Box 1'
        })
      })

      act(() => {
        result.current.enviarWhatsAppConfirmacion(result.current.citas[0])
      })

      expect(openSpy).toHaveBeenCalledOnce()
      const url = openSpy.mock.calls[0][0]
      expect(url).toMatch(/^https:\/\/wa\.me\/56912345678\?text=/)
      expect(url).toContain(encodeURIComponent('Ana Test'))
      expect(url).toContain(encodeURIComponent('10:00'))
      expect(url).toContain(encodeURIComponent('Box 1'))
    })

    it('agrega prefijo 569 para número de 8 dígitos (fijo chileno)', () => {
      const { result } = renderHook(() => useAgenda())
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      act(() => {
        result.current.guardarCita({
          id: 1,
          pacienteNombre: 'Test',
          pacienteTelefono: '12345678',
          fecha: '2026-08-15',
          horaInicio: '10:00'
        })
      })

      act(() => {
        result.current.enviarWhatsAppConfirmacion(result.current.citas[0])
      })

      const url = openSpy.mock.calls[0][0]
      expect(url).toMatch(/wa\.me\/56912345678/)
    })

    it('muestra alerta si no hay teléfono disponible y no abre WhatsApp', () => {
      const { result } = renderHook(() => useAgenda())
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      act(() => {
        result.current.guardarCita({
          id: 1,
          pacienteNombre: 'Sin Teléfono',
          fecha: '2026-08-15'
        })
      })

      act(() => {
        result.current.enviarWhatsAppConfirmacion(result.current.citas[0])
      })

      expect(alertSpy).toHaveBeenCalledOnce()
      expect(alertSpy.mock.calls[0][0]).toContain('Sin Teléfono')
      expect(openSpy).not.toHaveBeenCalled()
    })

    it('cambia estado a "Confirmado" antes de abrir WhatsApp', () => {
      const { result } = renderHook(() => useAgenda())
      vi.spyOn(window, 'open').mockImplementation(() => null)

      act(() => {
        result.current.guardarCita({
          id: 1,
          pacienteNombre: 'Test',
          pacienteTelefono: '912345678',
          estado: 'Agendada',
          fecha: '2026-08-15'
        })
      })

      act(() => {
        result.current.enviarWhatsAppConfirmacion(result.current.citas[0])
      })

      expect(result.current.citas[0].estado).toBe('Confirmado')
    })

    it('no hace nada si cita es null (guard clause)', () => {
      const { result } = renderHook(() => useAgenda())
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      act(() => {
        result.current.enviarWhatsAppConfirmacion(null)
      })

      expect(openSpy).not.toHaveBeenCalled()
    })
  })

  describe('irAHoy', () => {
    it('resetea fechaSeleccionada a la fecha local de hoy', () => {
      const { result } = renderHook(() => useAgenda())

      act(() => {
        result.current.setFechaSeleccionada('2020-01-01')
      })
      expect(result.current.fechaSeleccionada).toBe('2020-01-01')

      act(() => {
        result.current.irAHoy()
      })

      expect(result.current.fechaSeleccionada).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.current.fechaSeleccionada).not.toBe('2020-01-01')
    })
  })
})