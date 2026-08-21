/**
 * Tests del servicio odontogramaStorageService (F6-D-2)
 *
 * Valida el patrón Supabase + localStorage (offline-first)
 * para persistencia de odontogramas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { odontogramaStorageService } from './odontogramaStorageService'
import {
  guardarOdontograma as guardarOdontogramaSupabase,
  obtenerDatoClinico
} from '../../../services/datosClinicosSupabase'
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

// Mock de dependencias
vi.mock('../../../services/datosClinicosSupabase', () => ({
  guardarOdontograma: vi.fn(),
  obtenerDatoClinico: vi.fn()
}))

vi.mock('../../../services/localStorageRepository', () => ({
  leerJSON: vi.fn(),
  escribirJSON: vi.fn()
}))

describe('odontogramaStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerOdontogramaInicial', () => {
    it('retorna datos de Supabase cuando existen', () => {
      const datosSupabase = { '1.8': { general: 'caries', caras: {} } }
      obtenerDatoClinico.mockReturnValueOnce(datosSupabase)

      const resultado = odontogramaStorageService.obtenerOdontogramaInicial('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'odonto_inicial', null)
      expect(resultado).toEqual(datosSupabase)
      expect(leerJSON).not.toHaveBeenCalled()
    })

    it('usa fallback localStorage cuando Supabase retorna null', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      const datosLS = { '2.1': { general: 'sano', caras: {} } }
      leerJSON.mockReturnValueOnce(datosLS)

      const resultado = odontogramaStorageService.obtenerOdontogramaInicial('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'odonto_inicial', null)
      expect(leerJSON).toHaveBeenCalledWith('odonto_inicial_paciente-123', {})
      expect(resultado).toEqual(datosLS)
    })

    it('retorna fallback por defecto si pacienteId es null', () => {
      const fallback = { '1.1': { general: 'sano' } }

      const resultado = odontogramaStorageService.obtenerOdontogramaInicial(null, fallback)

      expect(obtenerDatoClinico).not.toHaveBeenCalled()
      expect(leerJSON).not.toHaveBeenCalled()
      expect(resultado).toEqual(fallback)
    })
  })

  describe('obtenerOdontogramaEvolucion', () => {
    it('usa la clave correcta para evolución', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      leerJSON.mockReturnValueOnce({})

      odontogramaStorageService.obtenerOdontogramaEvolucion('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'odonto_evolucion', null)
      expect(leerJSON).toHaveBeenCalledWith('odonto_evolucion_paciente-123', {})
    })
  })

  describe('guardarOdontogramaInicial', () => {
    it('escribe en Supabase y localStorage', async () => {
      guardarOdontogramaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })
      escribirJSON.mockReturnValueOnce(true)

      const datos = { '1.8': { general: 'caries' } }
      const resultado = await odontogramaStorageService.guardarOdontogramaInicial('paciente-123', datos)

      expect(guardarOdontogramaSupabase).toHaveBeenCalledWith('paciente-123', datos, 'inicial')
      expect(escribirJSON).toHaveBeenCalledWith('odonto_inicial_paciente-123', datos)
      expect(resultado).toBe(true)
    })

    it('sigue guardando en localStorage si Supabase falla', async () => {
      guardarOdontogramaSupabase.mockRejectedValueOnce(new Error('Network error'))
      escribirJSON.mockReturnValueOnce(true)

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const datos = { '1.8': { general: 'caries' } }
      const resultado = await odontogramaStorageService.guardarOdontogramaInicial('paciente-123', datos)

      expect(escribirJSON).toHaveBeenCalled()
      expect(resultado).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('retorna false si pacienteId es null', async () => {
      const resultado = await odontogramaStorageService.guardarOdontogramaInicial(null, {})

      expect(guardarOdontogramaSupabase).not.toHaveBeenCalled()
      expect(escribirJSON).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })
  })

  describe('guardarOdontogramaEvolucion', () => {
    it('usa el tipo correcto (evolucion)', async () => {
      guardarOdontogramaSupabase.mockResolvedValueOnce({ id: 'uuid-2' })
      escribirJSON.mockReturnValueOnce(true)

      const datos = { '1.8': { general: 'restauracion' } }
      await odontogramaStorageService.guardarOdontogramaEvolucion('paciente-123', datos)

      expect(guardarOdontogramaSupabase).toHaveBeenCalledWith('paciente-123', datos, 'evolucion')
      expect(escribirJSON).toHaveBeenCalledWith('odonto_evolucion_paciente-123', datos)
    })
  })

  describe('eliminarOdontogramasDePaciente', () => {
    it('remueve ambos odontogramas de localStorage', () => {
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})

      odontogramaStorageService.eliminarOdontogramasDePaciente('paciente-123')

      expect(removeSpy).toHaveBeenCalledWith('odonto_inicial_paciente-123')
      expect(removeSpy).toHaveBeenCalledWith('odonto_evolucion_paciente-123')

      removeSpy.mockRestore()
    })

    it('no hace nada si pacienteId es null', () => {
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})

      odontogramaStorageService.eliminarOdontogramasDePaciente(null)

      expect(removeSpy).not.toHaveBeenCalled()

      removeSpy.mockRestore()
    })
  })

  describe('API legacy', () => {
    it('obtenerOdontograma(key) delega a leerJSON', () => {
      leerJSON.mockReturnValueOnce({ custom: 'data' })

      const resultado = odontogramaStorageService.obtenerOdontograma('custom_key', {})

      expect(leerJSON).toHaveBeenCalledWith('custom_key', {})
      expect(resultado).toEqual({ custom: 'data' })
    })

    it('guardarOdontograma(key, data) delega a escribirJSON', () => {
      escribirJSON.mockReturnValueOnce(true)

      odontogramaStorageService.guardarOdontograma('custom_key', { data: 1 })

      expect(escribirJSON).toHaveBeenCalledWith('custom_key', { data: 1 })
    })
  })
})
