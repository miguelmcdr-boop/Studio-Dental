/**
 * Tests del servicio certificadosStorageService (F6-D-6)
 *
 * Valida el patrón Supabase + localStorage (offline-first)
 * para certificados médicos (asistencia y reposo).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { certificadosStorageService } from './certificadosStorageService'
import { pacientesStorageService } from './pacientesStorageService'
import {
  guardarCertificado as guardarCertificadoSupabase,
  obtenerDatoClinico
} from '../../../services/datosClinicosSupabase'

// Mock de dependencias
vi.mock('../../../services/datosClinicosSupabase', () => ({
  guardarCertificado: vi.fn(),
  obtenerDatoClinico: vi.fn()
}))

vi.mock('./pacientesStorageService', () => ({
  pacientesStorageService: {
    obtenerItem: vi.fn(),
    guardarItem: vi.fn(() => true),
    eliminarItem: vi.fn()
  }
}))

describe('certificadosStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerCertificados', () => {
    it('retorna certificados de Supabase cuando existen', () => {
      const certsSupabase = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          fechaEmision: '20-08-2026',
          tipo: 'asistencia',
          fechaAtencion: '2026-08-20',
          horaInicio: '10:00',
          horaFin: '11:00',
          diagnosticoMotivo: 'Exodoncia pieza 3.8',
          profesional: 'Dr. Juan Pérez'
        }
      ]
      obtenerDatoClinico.mockReturnValueOnce(certsSupabase)

      const resultado = certificadosStorageService.obtenerCertificados('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'certificados', null)
      expect(resultado).toEqual(certsSupabase)
      expect(pacientesStorageService.obtenerItem).not.toHaveBeenCalled()
    })

    it('usa fallback localStorage cuando Supabase retorna null', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      const certsLS = [
        { id: 123, tipo: 'reposo', diasReposo: 3 }
      ]
      pacientesStorageService.obtenerItem.mockReturnValueOnce(certsLS)

      const resultado = certificadosStorageService.obtenerCertificados('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'certificados', null)
      expect(pacientesStorageService.obtenerItem).toHaveBeenCalledWith('certificados_paciente-123', [])
      expect(resultado).toEqual(certsLS)
    })

    it('retorna fallback por defecto si pacienteId es null', () => {
      const fallback = [{ id: 1 }]

      const resultado = certificadosStorageService.obtenerCertificados(null, fallback)

      expect(obtenerDatoClinico).not.toHaveBeenCalled()
      expect(pacientesStorageService.obtenerItem).not.toHaveBeenCalled()
      expect(resultado).toEqual(fallback)
    })

    it('retorna fallback si localStorage no tiene array válido', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      pacientesStorageService.obtenerItem.mockReturnValueOnce({ invalido: true })

      const resultado = certificadosStorageService.obtenerCertificados('paciente-123', [])

      expect(resultado).toEqual([])
    })
  })

  describe('guardarCertificados', () => {
    it('escribe en localStorage primero y luego en Supabase', async () => {
      guardarCertificadoSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const certs = [
        { id: 1234567890, fechaEmision: '20-08-2026', tipo: 'asistencia' }
      ]
      const resultado = await certificadosStorageService.guardarCertificados('paciente-123', certs)

      expect(pacientesStorageService.guardarItem).toHaveBeenCalledWith('certificados_paciente-123', certs)
      expect(guardarCertificadoSupabase).toHaveBeenCalledWith('paciente-123', expect.objectContaining({
        fechaEmision: '20-08-2026',
        tipo: 'asistencia'
      }))
      expect(resultado).toBe(true)
    })

    it('no incluye ID si no es UUID válido de Supabase', async () => {
      guardarCertificadoSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const certs = [
        { id: 1234567890, tipo: 'asistencia' }
      ]
      await certificadosStorageService.guardarCertificados('paciente-123', certs)

      const llamadaSupabase = guardarCertificadoSupabase.mock.calls[0][1]
      expect(llamadaSupabase).not.toHaveProperty('id')
    })

    it('incluye ID si es UUID válido de Supabase', async () => {
      guardarCertificadoSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const uuidValido = '11111111-1111-1111-1111-111111111111'
      const certs = [
        { id: uuidValido, tipo: 'asistencia' }
      ]
      await certificadosStorageService.guardarCertificados('paciente-123', certs)

      const llamadaSupabase = guardarCertificadoSupabase.mock.calls[0][1]
      expect(llamadaSupabase.id).toBe(uuidValido)
    })

    it('guarda múltiples certificados en paralelo', async () => {
      guardarCertificadoSupabase.mockResolvedValue({ id: 'uuid' })

      const certs = [
        { id: 1, tipo: 'asistencia' },
        { id: 2, tipo: 'reposo', diasReposo: 3 }
      ]
      await certificadosStorageService.guardarCertificados('paciente-123', certs)

      expect(guardarCertificadoSupabase).toHaveBeenCalledTimes(2)
    })

    it('sigue guardando en localStorage si Supabase falla', async () => {
      guardarCertificadoSupabase.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const certs = [{ id: 1, tipo: 'asistencia' }]
      const resultado = await certificadosStorageService.guardarCertificados('paciente-123', certs)

      expect(pacientesStorageService.guardarItem).toHaveBeenCalled()
      expect(resultado).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('retorna false si pacienteId es null', async () => {
      const resultado = await certificadosStorageService.guardarCertificados(null, [])

      expect(guardarCertificadoSupabase).not.toHaveBeenCalled()
      expect(pacientesStorageService.guardarItem).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })

    it('retorna false si certificados no es array', async () => {
      const resultado = await certificadosStorageService.guardarCertificados('paciente-123', 'invalido')

      expect(guardarCertificadoSupabase).not.toHaveBeenCalled()
      expect(pacientesStorageService.guardarItem).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })
  })

  describe('eliminarCertificadosDePaciente', () => {
    it('remueve certificados de localStorage', () => {
      certificadosStorageService.eliminarCertificadosDePaciente('paciente-123')

      expect(pacientesStorageService.eliminarItem).toHaveBeenCalledWith('certificados_paciente-123')
    })

    it('no hace nada si pacienteId es null', () => {
      certificadosStorageService.eliminarCertificadosDePaciente(null)

      expect(pacientesStorageService.eliminarItem).not.toHaveBeenCalled()
    })
  })
})
