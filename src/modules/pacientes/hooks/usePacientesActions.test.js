import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockConfirm, mockAlert } = vi.hoisted(() => ({
  mockConfirm: vi.fn(() => Promise.resolve(true)),
  mockAlert: vi.fn(() => Promise.resolve())
}))

vi.mock('../services/pacientesStorageService', () => ({
  pacientesStorageService: {
    eliminarPaciente: vi.fn(() => Promise.resolve(true)),
    eliminarEvolucionesDePaciente: vi.fn(),
    eliminarRecetasDePaciente: vi.fn()
  }
}))

vi.mock('../../odontograma/services/odontogramaStorageService', () => ({
  odontogramaStorageService: {
    eliminarOdontogramasDePaciente: vi.fn()
  }
}))

vi.mock('../../presupuestos/services/presupuestosStorageService', () => ({
  presupuestosStorageService: {
    eliminarItemsDePaciente: vi.fn()
  }
}))

vi.mock('../../pagos/services/pagosAbonosLegacyService', () => ({
  eliminarAbonosDePaciente: vi.fn()
}))

vi.mock('../../../services/adjuntosStorageService', () => ({
  eliminarTodosPorPaciente: vi.fn(() => Promise.resolve())
}))

vi.mock('../../../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
  })
}))

vi.mock('../../../hooks/useAppDialog', () => ({
  useAppDialog: () => ({ confirm: mockConfirm, alert: mockAlert })
}))

import { usePacientesActions } from './usePacientesActions'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { odontogramaStorageService } from '../../odontograma/services/odontogramaStorageService'
import { presupuestosStorageService } from '../../presupuestos/services/presupuestosStorageService'
import { eliminarAbonosDePaciente } from '../../pagos/services/pagosAbonosLegacyService'
import { eliminarTodosPorPaciente } from '../../../services/adjuntosStorageService'

describe('usePacientesActions (Commit G3)', () => {
  const pacientes = [
    { id: 1, nombre: 'Ana' },
    { id: 2, nombre: 'Juan' }
  ]
  let setPacientes, setPacienteSeleccionado

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockResolvedValue(true)
    setPacientes = vi.fn()
    setPacienteSeleccionado = vi.fn()
  })

  describe('handleEliminarPaciente — flujo exitoso', () => {
    it('elimina paciente y limpia todos los storages relacionados', async () => {
      const { result } = renderHook(() =>
        usePacientesActions(pacientes, setPacientes, null, setPacienteSeleccionado)
      )

      let ok
      await act(async () => {
        ok = await result.current.handleEliminarPaciente(1)
      })

      expect(ok).toBe(true)
      expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' }))
      expect(pacientesStorageService.eliminarPaciente).toHaveBeenCalledWith(1)
      expect(odontogramaStorageService.eliminarOdontogramasDePaciente).toHaveBeenCalledWith(1)
      expect(pacientesStorageService.eliminarEvolucionesDePaciente).toHaveBeenCalledWith(1)
      expect(presupuestosStorageService.eliminarItemsDePaciente).toHaveBeenCalledWith(1)
      expect(eliminarAbonosDePaciente).toHaveBeenCalledWith(1)
      expect(pacientesStorageService.eliminarRecetasDePaciente).toHaveBeenCalledWith(1)
      expect(eliminarTodosPorPaciente).toHaveBeenCalledWith(1)
    })

    it('actualiza la lista local quitando el paciente eliminado', async () => {
      const { result } = renderHook(() =>
        usePacientesActions(pacientes, setPacientes, null, setPacienteSeleccionado)
      )

      await act(async () => {
        await result.current.handleEliminarPaciente(1)
      })

      expect(setPacientes).toHaveBeenCalledWith([{ id: 2, nombre: 'Juan' }])
    })

    it('limpia selección si el paciente eliminado estaba seleccionado', async () => {
      const seleccionado = { id: 1, nombre: 'Ana' }
      const { result } = renderHook(() =>
        usePacientesActions(pacientes, setPacientes, seleccionado, setPacienteSeleccionado)
      )

      await act(async () => {
        await result.current.handleEliminarPaciente(1)
      })

      expect(setPacienteSeleccionado).toHaveBeenCalledWith(null)
    })

    it('NO limpia selección si se eliminó un paciente diferente', async () => {
      const seleccionado = { id: 2, nombre: 'Juan' }
      const { result } = renderHook(() =>
        usePacientesActions(pacientes, setPacientes, seleccionado, setPacienteSeleccionado)
      )

      await act(async () => {
        await result.current.handleEliminarPaciente(1)
      })

      expect(setPacienteSeleccionado).not.toHaveBeenCalled()
    })
  })

  describe('handleEliminarPaciente — cancelación y errores', () => {
    it('no elimina si el usuario cancela la confirmación', async () => {
      mockConfirm.mockResolvedValueOnce(false)
      const { result } = renderHook(() =>
        usePacientesActions(pacientes, setPacientes, null, setPacienteSeleccionado)
      )

      let ok
      await act(async () => {
        ok = await result.current.handleEliminarPaciente(1)
      })

      expect(ok).toBe(false)
      expect(pacientesStorageService.eliminarPaciente).not.toHaveBeenCalled()
      expect(setPacientes).not.toHaveBeenCalled()
    })

    it('muestra error si soft-delete falla (retorna false)', async () => {
      pacientesStorageService.eliminarPaciente.mockResolvedValueOnce(false)
      const { result } = renderHook(() =>
        usePacientesActions(pacientes, setPacientes, null, setPacienteSeleccionado)
      )

      let ok
      await act(async () => {
        ok = await result.current.handleEliminarPaciente(1)
      })

      expect(ok).toBe(false)
      expect(mockAlert).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error al eliminar', variant: 'error'
      }))
      expect(setPacientes).not.toHaveBeenCalled()
    })

    it('muestra error si eliminarPaciente lanza excepción', async () => {
      pacientesStorageService.eliminarPaciente.mockRejectedValueOnce(new Error('Supabase offline'))
      const { result } = renderHook(() =>
        usePacientesActions(pacientes, setPacientes, null, setPacienteSeleccionado)
      )

      let ok
      await act(async () => {
        ok = await result.current.handleEliminarPaciente(1)
      })

      expect(ok).toBe(false)
      expect(mockAlert).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error inesperado', variant: 'error'
      }))
    })
  })

  describe('guard de eliminación simultánea', () => {
    it('eliminando empieza en false', () => {
      const { result } = renderHook(() =>
        usePacientesActions(pacientes, setPacientes, null, setPacienteSeleccionado)
      )
      expect(result.current.eliminando).toBe(false)
    })
  })
})
