/**
 * Tests del servicio evolucionesStorageService (F6-D-5)
 *
 * Valida el patrón Supabase + localStorage (offline-first)
 * con transformación bidireccional entre formato local y Supabase.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evolucionesStorageService } from './evolucionesStorageService'
import { pacientesStorageService } from './pacientesStorageService'
import {
  guardarEvolucionClinica as guardarEvolucionSupabase,
  obtenerDatoClinico
} from '../../../services/datosClinicosSupabase'

// Mock de dependencias
vi.mock('../../../services/datosClinicosSupabase', () => ({
  guardarEvolucionClinica: vi.fn(),
  obtenerDatoClinico: vi.fn()
}))

vi.mock('./pacientesStorageService', () => ({
  pacientesStorageService: {
    obtenerItem: vi.fn(),
    guardarItem: vi.fn(() => true),
    eliminarItem: vi.fn()
  }
}))

describe('evolucionesStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerEvoluciones', () => {
    it('retorna evoluciones de Supabase transformadas cuando existen', () => {
      const evosSupabase = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          fecha_hora: '2026-08-20T14:30:00.000Z',
          texto: 'Paciente refiere dolor agudo en pieza 1.8',
          tipo: 'evolucion'
        }
      ]
      obtenerDatoClinico.mockReturnValueOnce(evosSupabase)

      const resultado = evolucionesStorageService.obtenerEvoluciones('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'evoluciones_notas', null)
      expect(resultado).toEqual([
        {
          id: '11111111-1111-1111-1111-111111111111',
          fecha: '2026-08-20T14:30:00.000Z',
          texto: 'Paciente refiere dolor agudo en pieza 1.8',
          tipo: 'evolucion'
        }
      ])
      expect(pacientesStorageService.obtenerItem).not.toHaveBeenCalled()
    })

    it('usa fallback localStorage cuando Supabase retorna null', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      const evosLS = [
        { id: 123, fecha: '20-08-2026 14:30', texto: 'Nota de prueba' }
      ]
      pacientesStorageService.obtenerItem.mockReturnValueOnce(evosLS)

      const resultado = evolucionesStorageService.obtenerEvoluciones('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'evoluciones_notas', null)
      expect(pacientesStorageService.obtenerItem).toHaveBeenCalledWith('evoluciones_notas_paciente-123', [])
      expect(resultado).toEqual(evosLS)
    })

    it('retorna fallback por defecto si pacienteId es null', () => {
      const fallback = [{ id: 1 }]

      const resultado = evolucionesStorageService.obtenerEvoluciones(null, fallback)

      expect(obtenerDatoClinico).not.toHaveBeenCalled()
      expect(pacientesStorageService.obtenerItem).not.toHaveBeenCalled()
      expect(resultado).toEqual(fallback)
    })

    it('retorna fallback si localStorage no tiene array válido', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      pacientesStorageService.obtenerItem.mockReturnValueOnce({ invalido: true })

      const resultado = evolucionesStorageService.obtenerEvoluciones('paciente-123', [])

      expect(resultado).toEqual([])
    })
  })

  describe('guardarEvoluciones', () => {
    it('escribe en localStorage primero y luego en Supabase', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const evos = [
        { id: 1234567890, fecha: '20-08-2026 14:30', texto: 'Nota clínica' }
      ]
      const resultado = await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      expect(pacientesStorageService.guardarItem).toHaveBeenCalledWith('evoluciones_notas_paciente-123', evos)
      expect(guardarEvolucionSupabase).toHaveBeenCalledWith('paciente-123', expect.objectContaining({
        texto: 'Nota clínica',
        tipo: 'evolucion'
      }))
      expect(resultado).toBe(true)
    })

    it('transforma fecha chilena DD-MM-YYYY HH:MM a ISO string', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const evos = [
        { id: 123, fecha: '20-08-2026 14:30', texto: 'Nota' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      const llamadaSupabase = guardarEvolucionSupabase.mock.calls[0][1]
      expect(llamadaSupabase.fecha_hora).toBe('2026-08-20T14:30:00.000Z')
    })

    it('transforma fecha con slash DD/MM/YYYY HH:MM a ISO string', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const evos = [
        { id: 123, fecha: '15/01/2026 09:45', texto: 'Nota' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      const llamadaSupabase = guardarEvolucionSupabase.mock.calls[0][1]
      expect(llamadaSupabase.fecha_hora).toBe('2026-01-15T09:45:00.000Z')
    })

    it('mantiene formato ISO si ya está en formato válido', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const isoFecha = '2026-03-10T15:00:00.000Z'
      const evos = [
        { id: 123, fecha: isoFecha, texto: 'Nota' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      const llamadaSupabase = guardarEvolucionSupabase.mock.calls[0][1]
      expect(llamadaSupabase.fecha_hora).toBe(isoFecha)
    })

    it('usa fecha actual si la fecha es inválida', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const evos = [
        { id: 123, fecha: 'fecha-invalida', texto: 'Nota' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      const llamadaSupabase = guardarEvolucionSupabase.mock.calls[0][1]
      expect(llamadaSupabase.fecha_hora).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('no incluye ID si no es UUID válido de Supabase', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const evos = [
        { id: 1234567890, fecha: '20-08-2026 14:30', texto: 'Nota' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      const llamadaSupabase = guardarEvolucionSupabase.mock.calls[0][1]
      expect(llamadaSupabase).not.toHaveProperty('id')
    })

    it('incluye ID si es UUID válido de Supabase', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const uuidValido = '11111111-1111-1111-1111-111111111111'
      const evos = [
        { id: uuidValido, fecha: '20-08-2026 14:30', texto: 'Nota' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      const llamadaSupabase = guardarEvolucionSupabase.mock.calls[0][1]
      expect(llamadaSupabase.id).toBe(uuidValido)
    })

    it('agrega tipo por defecto si no existe', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const evos = [
        { id: 123, fecha: '20-08-2026 14:30', texto: 'Nota sin tipo' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      const llamadaSupabase = guardarEvolucionSupabase.mock.calls[0][1]
      expect(llamadaSupabase.tipo).toBe('evolucion')
    })

    it('preserva tipo si ya existe', async () => {
      guardarEvolucionSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const evos = [
        { id: 123, fecha: '20-08-2026 14:30', texto: 'Nota', tipo: 'tratamiento' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      const llamadaSupabase = guardarEvolucionSupabase.mock.calls[0][1]
      expect(llamadaSupabase.tipo).toBe('tratamiento')
    })

    it('guarda múltiples evoluciones en paralelo', async () => {
      guardarEvolucionSupabase.mockResolvedValue({ id: 'uuid' })

      const evos = [
        { id: 1, fecha: '20-08-2026 14:30', texto: 'Nota 1' },
        { id: 2, fecha: '21-08-2026 10:00', texto: 'Nota 2' }
      ]
      await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      expect(guardarEvolucionSupabase).toHaveBeenCalledTimes(2)
    })

    it('sigue guardando en localStorage si Supabase falla', async () => {
      guardarEvolucionSupabase.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const evos = [{ id: 1, fecha: '20-08-2026 14:30', texto: 'Nota' }]
      const resultado = await evolucionesStorageService.guardarEvoluciones('paciente-123', evos)

      expect(pacientesStorageService.guardarItem).toHaveBeenCalled()
      expect(resultado).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('retorna false si pacienteId es null', async () => {
      const resultado = await evolucionesStorageService.guardarEvoluciones(null, [])

      expect(guardarEvolucionSupabase).not.toHaveBeenCalled()
      expect(pacientesStorageService.guardarItem).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })

    it('retorna false si evoluciones no es array', async () => {
      const resultado = await evolucionesStorageService.guardarEvoluciones('paciente-123', 'invalido')

      expect(guardarEvolucionSupabase).not.toHaveBeenCalled()
      expect(pacientesStorageService.guardarItem).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })
  })

  describe('eliminarEvolucionesDePaciente', () => {
    it('remueve evoluciones de localStorage', () => {
      evolucionesStorageService.eliminarEvolucionesDePaciente('paciente-123')

      expect(pacientesStorageService.eliminarItem).toHaveBeenCalledWith('evoluciones_notas_paciente-123')
    })

    it('no hace nada si pacienteId es null', () => {
      evolucionesStorageService.eliminarEvolucionesDePaciente(null)

      expect(pacientesStorageService.eliminarItem).not.toHaveBeenCalled()
    })
  })
})
