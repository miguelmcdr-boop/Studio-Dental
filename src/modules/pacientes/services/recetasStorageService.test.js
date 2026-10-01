/**
 * Tests del servicio recetasStorageService (F6-D-4)
 *
 * Valida el patrón Supabase + localStorage (offline-first)
 * con transformación bidireccional entre formato simple y formato Supabase.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recetasStorageService } from './recetasStorageService'
import {
  guardarReceta as guardarRecetaSupabase,
  obtenerDatoClinico
} from '../../../services/datosClinicosSupabase'
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

// Mock de dependencias
vi.mock('../../../services/datosClinicosSupabase', () => ({
  guardarReceta: vi.fn(),
  obtenerDatoClinico: vi.fn()
}))

vi.mock('../../../services/localStorageRepository', () => ({
  leerJSON: vi.fn(),
  escribirJSON: vi.fn()
}))

describe('recetasStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerRecetas', () => {
    it('retorna recetas de Supabase transformadas cuando existen', () => {
      const recetasSupabase = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          fecha: '2026-01-15',
          medicamentos: ['Amoxicilina 500mg'],
          indicaciones: 'Tomar 1 cada 8 horas por 7 días'
        }
      ]
      obtenerDatoClinico.mockReturnValueOnce(recetasSupabase)

      const resultado = recetasStorageService.obtenerRecetas('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'recetas', null)
      expect(resultado).toEqual([
        {
          id: '11111111-1111-1111-1111-111111111111',
          fecha: '2026-01-15',
          medicamento: 'Amoxicilina 500mg',
          indicacion: 'Tomar 1 cada 8 horas por 7 días'
        }
      ])
      expect(leerJSON).not.toHaveBeenCalled()
    })

    it('transforma correctamente medicamentos array a medicamento string', () => {
      const recetasSupabase = [
        {
          id: 'uuid-1',
          fecha: '2026-01-15',
          medicamentos: ['Ibuprofeno 400mg'],
          indicaciones: 'Cada 12 horas'
        }
      ]
      obtenerDatoClinico.mockReturnValueOnce(recetasSupabase)

      const resultado = recetasStorageService.obtenerRecetas('paciente-123')

      expect(resultado[0].medicamento).toBe('Ibuprofeno 400mg')
    })

    it('maneja medicamentos vacíos correctamente', () => {
      const recetasSupabase = [
        {
          id: 'uuid-1',
          fecha: '2026-01-15',
          medicamentos: [],
          indicaciones: 'Cada 12 horas'
        }
      ]
      obtenerDatoClinico.mockReturnValueOnce(recetasSupabase)

      const resultado = recetasStorageService.obtenerRecetas('paciente-123')

      expect(resultado[0].medicamento).toBe('')
    })

    it('usa fallback localStorage cuando Supabase retorna null', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      const recetasLS = [
        { id: 123, fecha: '2026-01-10', medicamento: 'Paracetamol', indicacion: 'Cada 6 horas' }
      ]
      leerJSON.mockReturnValueOnce(recetasLS)

      const resultado = recetasStorageService.obtenerRecetas('paciente-123')

      expect(obtenerDatoClinico).toHaveBeenCalledWith('paciente-123', 'recetas', null)
      expect(leerJSON).toHaveBeenCalledWith('recetas_paciente-123', [])
      expect(resultado).toEqual(recetasLS)
    })

    it('retorna fallback por defecto si pacienteId es null', () => {
      const fallback = [{ id: 1 }]

      const resultado = recetasStorageService.obtenerRecetas(null, fallback)

      expect(obtenerDatoClinico).not.toHaveBeenCalled()
      expect(leerJSON).not.toHaveBeenCalled()
      expect(resultado).toEqual(fallback)
    })

    it('retorna fallback si localStorage no tiene array válido', () => {
      obtenerDatoClinico.mockReturnValueOnce(null)
      leerJSON.mockReturnValueOnce({ invalido: true })

      const resultado = recetasStorageService.obtenerRecetas('paciente-123', [])

      expect(resultado).toEqual([])
    })
  })

  describe('guardarRecetas', () => {
    it('escribe en localStorage primero y luego en Supabase', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const recetas = [
        { id: 123456, fecha: '2026-01-15', medicamento: 'Amoxicilina', indicacion: 'Cada 8 horas' }
      ]
      const resultado = await recetasStorageService.guardarRecetas('paciente-123', recetas)

      expect(escribirJSON).toHaveBeenCalledWith('recetas_paciente-123', recetas)
      expect(guardarRecetaSupabase).toHaveBeenCalledWith('paciente-123', expect.objectContaining({
        fecha: '2026-01-15',
        medicamentos: ['Amoxicilina'],
        indicaciones: 'Cada 8 horas'
      }))
      expect(resultado).toBe(true)
    })

    it('transforma receta simple a formato Supabase (medicamento → medicamentos array)', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const recetas = [
        { id: 123456, fecha: '2026-01-15', medicamento: 'Ibuprofeno 400mg', indicacion: 'Cada 12 horas' }
      ]
      await recetasStorageService.guardarRecetas('paciente-123', recetas)

      const llamadaSupabase = guardarRecetaSupabase.mock.calls[0][1]
      expect(llamadaSupabase.medicamentos).toEqual(['Ibuprofeno 400mg'])
      expect(llamadaSupabase.indicaciones).toBe('Cada 12 horas')
    })

    it('no incluye ID si no es UUID válido de Supabase', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const recetas = [
        { id: 123456789, fecha: '2026-01-15', medicamento: 'Amoxicilina', indicacion: '...' }
      ]
      await recetasStorageService.guardarRecetas('paciente-123', recetas)

      const llamadaSupabase = guardarRecetaSupabase.mock.calls[0][1]
      expect(llamadaSupabase).not.toHaveProperty('id')
    })

    it('incluye ID si es UUID válido de Supabase', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const uuidValido = '11111111-1111-1111-1111-111111111111'
      const recetas = [
        { id: uuidValido, fecha: '2026-01-15', medicamento: 'Amoxicilina', indicacion: '...' }
      ]
      await recetasStorageService.guardarRecetas('paciente-123', recetas)

      const llamadaSupabase = guardarRecetaSupabase.mock.calls[0][1]
      expect(llamadaSupabase.id).toBe(uuidValido)
    })

    it('guarda múltiples recetas en paralelo', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValue({ id: 'uuid' })

      const recetas = [
        { id: 1, fecha: '2026-01-15', medicamento: 'Amoxicilina', indicacion: '...' },
        { id: 2, fecha: '2026-01-16', medicamento: 'Ibuprofeno', indicacion: '...' }
      ]
      await recetasStorageService.guardarRecetas('paciente-123', recetas)

      expect(guardarRecetaSupabase).toHaveBeenCalledTimes(2)
    })

    it('sigue guardando en localStorage si Supabase falla', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const recetas = [{ id: 1, fecha: '2026-01-15', medicamento: 'Amoxicilina', indicacion: '...' }]
      const resultado = await recetasStorageService.guardarRecetas('paciente-123', recetas)

      expect(escribirJSON).toHaveBeenCalled()
      expect(resultado).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('retorna false si pacienteId es null', async () => {
      const resultado = await recetasStorageService.guardarRecetas(null, [])

      expect(guardarRecetaSupabase).not.toHaveBeenCalled()
      expect(escribirJSON).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })

    it('retorna false si recetas no es array', async () => {
      const resultado = await recetasStorageService.guardarRecetas('paciente-123', 'invalido')

      expect(guardarRecetaSupabase).not.toHaveBeenCalled()
      expect(escribirJSON).not.toHaveBeenCalled()
      expect(resultado).toBe(false)
    })
  })

  describe('normalización de fechas', () => {
    it('convierte formato chileno DD-MM-YYYY a ISO YYYY-MM-DD', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const recetas = [
        { id: 1, fecha: '20-08-2026', medicamento: 'Amoxicilina', indicacion: '...' }
      ]
      await recetasStorageService.guardarRecetas('paciente-123', recetas)

      const llamadaSupabase = guardarRecetaSupabase.mock.calls[0][1]
      expect(llamadaSupabase.fecha).toBe('2026-08-20')
    })

    it('convierte formato DD/MM/YYYY a ISO YYYY-MM-DD', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const recetas = [
        { id: 1, fecha: '15/01/2026', medicamento: 'Ibuprofeno', indicacion: '...' }
      ]
      await recetasStorageService.guardarRecetas('paciente-123', recetas)

      const llamadaSupabase = guardarRecetaSupabase.mock.calls[0][1]
      expect(llamadaSupabase.fecha).toBe('2026-01-15')
    })

    it('mantiene formato ISO si ya está en YYYY-MM-DD', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const recetas = [
        { id: 1, fecha: '2026-03-10', medicamento: 'Paracetamol', indicacion: '...' }
      ]
      await recetasStorageService.guardarRecetas('paciente-123', recetas)

      const llamadaSupabase = guardarRecetaSupabase.mock.calls[0][1]
      expect(llamadaSupabase.fecha).toBe('2026-03-10')
    })

    it('usa fecha actual si la fecha es inválida', async () => {
      escribirJSON.mockReturnValueOnce(true)
      guardarRecetaSupabase.mockResolvedValueOnce({ id: 'uuid-1' })

      const recetas = [
        { id: 1, fecha: 'fecha-invalida', medicamento: 'Amoxicilina', indicacion: '...' }
      ]
      await recetasStorageService.guardarRecetas('paciente-123', recetas)

      const llamadaSupabase = guardarRecetaSupabase.mock.calls[0][1]
      // Debe ser una fecha ISO válida (YYYY-MM-DD)
      expect(llamadaSupabase.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('eliminarRecetasDePaciente', () => {
    it('remueve recetas de localStorage', () => {
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})

      recetasStorageService.eliminarRecetasDePaciente('paciente-123')

      expect(removeSpy).toHaveBeenCalledWith('recetas_paciente-123')

      removeSpy.mockRestore()
    })

    it('no hace nada si pacienteId es null', () => {
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})

      recetasStorageService.eliminarRecetasDePaciente(null)

      expect(removeSpy).not.toHaveBeenCalled()

      removeSpy.mockRestore()
    })
  })
})
