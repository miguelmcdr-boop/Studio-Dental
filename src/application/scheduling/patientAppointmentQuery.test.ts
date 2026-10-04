import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  obtenerProximaCitaPaciente,
  obtenerCitasPaciente,
} from './patientAppointmentQuery'
import { agendaStorageService, type Cita } from '../../domains/operations/agenda'

describe('patientAppointmentQuery (Application Service)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('obtenerProximaCitaPaciente', () => {
    it('debe retornar null si no se proporciona pacienteId', () => {
      expect(obtenerProximaCitaPaciente(null)).toBeNull()
      expect(obtenerProximaCitaPaciente(undefined)).toBeNull()
      expect(obtenerProximaCitaPaciente('')).toBeNull()
    })

    it('debe retornar null si no hay citas registradas', () => {
      vi.spyOn(agendaStorageService, 'obtenerCitas').mockReturnValue([])
      expect(obtenerProximaCitaPaciente('paciente-1')).toBeNull()
    })

    it('debe retornar null si ocurre un error en el servicio de agenda', () => {
      vi.spyOn(agendaStorageService, 'obtenerCitas').mockImplementation(() => {
        throw new Error('Storage error')
      })
      expect(obtenerProximaCitaPaciente('paciente-1')).toBeNull()
    })

    it('debe ignorar citas canceladas o de otros pacientes', () => {
      const mockCitas: Cita[] = [
        {
          id: '1',
          pacienteId: 'paciente-2',
          fecha: '2026-12-01',
          horaInicio: '10:00',
          estado: 'Confirmado',
        },
        {
          id: '2',
          pacienteId: 'paciente-1',
          fecha: '2026-12-01',
          horaInicio: '11:00',
          estado: 'Cancelada',
        },
      ]
      vi.spyOn(agendaStorageService, 'obtenerCitas').mockReturnValue(mockCitas)
      const res = obtenerProximaCitaPaciente('paciente-1')
      expect(res).toBeNull()
    })

    it('debe retornar la cita futura más próxima correctamente mapeada', () => {
      const fechaBase = new Date('2026-10-01T10:00:00')
      const mockCitas: Cita[] = [
        {
          id: '1',
          pacienteId: 'p-1',
          fecha: '2026-10-15',
          horaInicio: '15:30',
          boxAsignado: 'Box 1',
          trataMiento: 'Limpieza dental',
          estado: 'Agendado',
        },
        {
          id: '2',
          pacienteId: 'p-1',
          fecha: '2026-10-05',
          horaInicio: '09:00',
          boxAsignado: 'Box 2',
          trataMiento: 'Evaluación general',
          estado: 'Confirmado',
        },
        {
          id: '3',
          pacienteId: 'p-1',
          fecha: '2026-09-01', // Pasada
          horaInicio: '11:00',
          estado: 'Completado',
        },
      ]
      vi.spyOn(agendaStorageService, 'obtenerCitas').mockReturnValue(mockCitas)

      const proxima = obtenerProximaCitaPaciente('p-1', fechaBase)
      expect(proxima).toEqual({
        fecha: '2026-10-05',
        hora: '09:00',
        box: 'Box 2',
        motivo: 'Evaluación general',
      })
    })
  })

  describe('obtenerCitasPaciente', () => {
    it('debe retornar array vacío si no hay pacienteId', () => {
      expect(obtenerCitasPaciente('')).toEqual([])
      expect(obtenerCitasPaciente(null)).toEqual([])
    })

    it('debe retornar todas las citas del paciente', () => {
      const mockCitas: Cita[] = [
        {
          id: '1',
          pacienteId: 'p-1',
          fecha: '2026-10-15',
          horaInicio: '15:30',
          estado: 'Agendado',
        },
        {
          id: '2',
          pacienteId: 'p-2',
          fecha: '2026-10-05',
          horaInicio: '09:00',
          estado: 'Confirmado',
        },
        {
          id: '3',
          pacienteId: 'p-1',
          fecha: '2026-09-01',
          horaInicio: '11:00',
          estado: 'Completado',
        },
      ]
      vi.spyOn(agendaStorageService, 'obtenerCitas').mockReturnValue(mockCitas)

      const citas = obtenerCitasPaciente('p-1')
      expect(citas).toHaveLength(2)
      expect(citas.map((c) => c.id)).toEqual(['1', '3'])
    })
  })
})
