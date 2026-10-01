/**
 * Tests del servicio periodontogramaStorageService (F6-D-3)
 *
 * Valida el patrón Supabase + localStorage (offline-first)
 * para persistencia de periodontogramas (inicial, control, historial).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { periodontogramaStorageService } from './periodontogramaStorageService'
import {
  guardarPeriodontograma as guardarPeriodontogramaSupabase,
  guardarPeriodontogramaHistorial as guardarPeriodontogramaHistorialSupabase,
  obtenerDatoClinico
} from '../../../services/datosClinicosSupabase'
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

// Mock de dependencias
vi.mock('../../../services/datosClinicosSupabase', () => ({
  guardarPeriodontograma: vi.fn(),
  guardarPeriodontogramaHistorial: vi.fn(),
  obtenerDatoClinico: vi.fn()
}))

vi.mock('../../../services/localStorageRepository', () => ({
  leerJSON: vi.fn(),
  escribirJSON: vi.fn()
}))

describe('periodontogramaStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerPeriodontogramaDePaciente', () => {
    it('retorna datos de Supabase cuando existen', () => {
      const datosSupabase = { piezas: { '1.8': { sondaje: {} } } }
      obtenerDatoClinico.mockReturnValueOnce(datosSupabase)

      const resultado = periodontogramaStorageService.obtenerPeriodontogramaDePaciente('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'periodontograma', null)
      expect(resultado).toEqual(datosSupabase)
      expect(leerJSON).not.toHaveBeenCalled()
    })

    it('usa fallback localStorage cuando Supabase retorna null', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      const datosLS = { piezas: { '1.8': { sondaje: { V: 3 } } } }
      leerJSON.mockReturnValueOnce(datosLS)

      const resultado = periodontogramaStorageService.obtenerPeriodontogramaDePaciente('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'periodontograma', null)
      expect(leerJSON).toHaveBeenCalledWith('periodontograma_paciente-123', {})
      expect(resultado).toEqual(datosLS)
    })

    it('retorna fallback por defecto si pacienteId es null', () => {
      const fallback = { piezas: {} }

      const resultado = periodontogramaStorageService.obtenerPeriodontogramaDePaciente(null, fallback)

      expect(obtenerDatoClinico).not.toHaveBeenCalled()
      expect(leerJSON).not.toHaveBeenCalled()
      expect(resultado).toEqual(fallback)
    })
  })

  describe('obtenerControlDePaciente', () => {
    it('usa la clave correcta para control', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      leerJSON.mockReturnValueOnce({})

      periodontogramaStorageService.obtenerControlDePaciente('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'periodontograma_control', null)
      expect(leerJSON).toHaveBeenCalledWith('periodontograma_control_paciente-123', {})
    })
  })

  describe('obtenerHistorialControles', () => {
    it('usa la clave correcta para historial', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      leerJSON.mockReturnValueOnce([])

      periodontogramaStorageService.obtenerHistorialControles('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'periodonto_historial', null)
      expect(leerJSON).toHaveBeenCalledWith('periodonto_historial_paciente-123', [])
    })

    it('retorna historial de Supabase cuando existe', () => {
      const historialSupabase = [
        { id: 1, fecha: '2026-01-01', observacion: 'Control 1' },
        { id: 2, fecha: '2026-02-01', observacion: 'Control 2' }
      ]
      obtenerDatoClinico.mockReturnValueOnce(historialSupabase)

      const resultado = periodontogramaStorageService.obtenerHistorialControles('paciente-123')

      expect(resultado).toEqual(historialSupabase)
      expect(leerJSON).not.toHaveBeenCalled()
    })
  })

  describe('guardarPeriodontogramaDePaciente', () => {
    it('escribe en Supabase (tipo inicial) y localStorage', async () => {
      guardarPeriodontogramaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })
      escribirJSON.mockReturnValueOnce(true)

      const datos = { piezas: { '1.8': { sondaje: {} } } }
      const resultado = await periodontogramaStorageService.guardarPeriodontogramaDePaciente('paciente-123', datos)

      expect(guardarPeriodontogramaSupabase).toHaveBeenCalledWith('paciente-123', datos, 'inicial')
      expect(escribirJSON).toHaveBeenCalledWith('periodontograma_paciente-123', datos)
      expect(resultado).toBe(true)
    })

    it('sigue guardando en localStorage si Supabase falla', async () => {
      guardarPeriodontogramaSupabase.mockRejectedValueOnce(new Error('Network error'))
      escribirJSON.mockReturnValueOnce(true)

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const datos = { piezas: {} }
      const resultado = await periodontogramaStorageService.guardarPeriodontogramaDePaciente('paciente-123', datos)

      expect(escribirJSON).toHaveBeenCalled()
      expect(resultado).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('retorna false si pacienteId es null', async () => {
      const resultado = await periodontogramaStorageService.guardarPeriodontogramaDePaciente(null, {})

      expect(guardarPeriodontogramaSupabase).not.toHaveBeenCalled()
      expect(escribirJSON).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })
  })

  describe('guardarControlDePaciente', () => {
    it('usa el tipo correcto (control)', async () => {
      guardarPeriodontogramaSupabase.mockResolvedValueOnce({ id: 'uuid-2' })
      escribirJSON.mockReturnValueOnce(true)

      const datos = { piezas: { '1.8': { sondaje: { V: 3 } } } }
      await periodontogramaStorageService.guardarControlDePaciente('paciente-123', datos)

      expect(guardarPeriodontogramaSupabase).toHaveBeenCalledWith('paciente-123', datos, 'control')
      expect(escribirJSON).toHaveBeenCalledWith('periodontograma_control_paciente-123', datos)
    })
  })

  describe('guardarHistorialControles', () => {
    it('usa el método específico para historial', async () => {
      guardarPeriodontogramaHistorialSupabase.mockResolvedValueOnce({ id: 'uuid-3' })
      escribirJSON.mockReturnValueOnce(true)

      const historial = [
        { id: 1, fecha: '2026-01-01', observacion: 'Control 1' }
      ]
      await periodontogramaStorageService.guardarHistorialControles('paciente-123', historial)

      expect(guardarPeriodontogramaHistorialSupabase).toHaveBeenCalledWith('paciente-123', historial)
      expect(escribirJSON).toHaveBeenCalledWith('periodonto_historial_paciente-123', historial)
    })

    it('sigue guardando en localStorage si Supabase falla', async () => {
      guardarPeriodontogramaHistorialSupabase.mockRejectedValueOnce(new Error('Network error'))
      escribirJSON.mockReturnValueOnce(true)

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const historial = [{ id: 1 }]
      const resultado = await periodontogramaStorageService.guardarHistorialControles('paciente-123', historial)

      expect(escribirJSON).toHaveBeenCalled()
      expect(resultado).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('retorna false si pacienteId es null', async () => {
      const resultado = await periodontogramaStorageService.guardarHistorialControles(null, [])

      expect(guardarPeriodontogramaHistorialSupabase).not.toHaveBeenCalled()
      expect(escribirJSON).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })
  })

  describe('eliminarDatosDePaciente', () => {
    it('remueve los 3 tipos de datos de localStorage', () => {
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})

      periodontogramaStorageService.eliminarDatosDePaciente('paciente-123')

      expect(removeSpy).toHaveBeenCalledWith('periodontograma_paciente-123')
      expect(removeSpy).toHaveBeenCalledWith('periodontograma_control_paciente-123')
      expect(removeSpy).toHaveBeenCalledWith('periodonto_historial_paciente-123')

      removeSpy.mockRestore()
    })

    it('no hace nada si pacienteId es null', () => {
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})

      periodontogramaStorageService.eliminarDatosDePaciente(null)

      expect(removeSpy).not.toHaveBeenCalled()

      removeSpy.mockRestore()
    })
  })
})
