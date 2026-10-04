import { describe, it, expect, vi, beforeEach } from 'vitest'
import { quirurgicoStorageService } from './quirurgicoStorageService'
import * as datosClinicosSupabase from '../../../services/datosClinicosSupabase'
import * as localStorageRepository from '../../../services/localStorageRepository'

vi.mock('../../../services/datosClinicosSupabase', () => ({
  obtenerDatoClinico: vi.fn(),
  guardarDatoGenerico: vi.fn()
}))

vi.mock('../../../services/localStorageRepository', () => ({
  leerJSON: vi.fn(),
  escribirJSON: vi.fn()
}))

describe('quirurgicoStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('obtenerImplantesDePaciente', () => {
    it('retorna fallback si pacienteId no es provisto', () => {
      const res = quirurgicoStorageService.obtenerImplantesDePaciente(null, ['fallback'])
      expect(res).toEqual(['fallback'])
    })

    it('retorna datoClinico de Supabase si existe', () => {
      vi.mocked(datosClinicosSupabase.obtenerDatoClinico).mockReturnValue([{ id: 1, marca: 'Straumann' }])
      const res = quirurgicoStorageService.obtenerImplantesDePaciente('pac-1')
      expect(res).toEqual([{ id: 1, marca: 'Straumann' }])
      expect(localStorageRepository.leerJSON).not.toHaveBeenCalled()
    })

    it('retorna localStorage si datoClinico es null', () => {
      vi.mocked(datosClinicosSupabase.obtenerDatoClinico).mockReturnValue(null)
      vi.mocked(localStorageRepository.leerJSON).mockReturnValue([{ id: 2, marca: 'Nobel' }])
      const res = quirurgicoStorageService.obtenerImplantesDePaciente('pac-1')
      expect(res).toEqual([{ id: 2, marca: 'Nobel' }])
      expect(localStorageRepository.leerJSON).toHaveBeenCalledWith('quirurgico_implantes_pac-1', [])
    })
  })

  describe('guardarImplantesDePaciente', () => {
    it('retorna false si pacienteId es null', async () => {
      const res = await quirurgicoStorageService.guardarImplantesDePaciente(null, [])
      expect(res).toBe(false)
    })

    it('escribe en Supabase y localStorage', async () => {
      vi.mocked(localStorageRepository.escribirJSON).mockReturnValue(true)
      const res = await quirurgicoStorageService.guardarImplantesDePaciente('pac-1', [{ id: 1 }])
      expect(res).toBe(true)
      expect(datosClinicosSupabase.guardarDatoGenerico).toHaveBeenCalledWith('pac-1', 'quirurgico_implantes', [{ id: 1 }])
      expect(localStorageRepository.escribirJSON).toHaveBeenCalledWith('quirurgico_implantes_pac-1', [{ id: 1 }])
    })
  })

  describe('obtenerEndodonciasDePaciente', () => {
    it('retorna fallback si pacienteId no es provisto', () => {
      const res = quirurgicoStorageService.obtenerEndodonciasDePaciente(undefined, [])
      expect(res).toEqual([])
    })

    it('retorna datoClinico de Supabase si existe', () => {
      vi.mocked(datosClinicosSupabase.obtenerDatoClinico).mockReturnValue([{ id: 10, pieza: '1.6' }])
      const res = quirurgicoStorageService.obtenerEndodonciasDePaciente('pac-1')
      expect(res).toEqual([{ id: 10, pieza: '1.6' }])
    })

    it('retorna localStorage si Supabase retorna null', () => {
      vi.mocked(datosClinicosSupabase.obtenerDatoClinico).mockReturnValue(null)
      vi.mocked(localStorageRepository.leerJSON).mockReturnValue([{ id: 20, pieza: '2.1' }])
      const res = quirurgicoStorageService.obtenerEndodonciasDePaciente('pac-1')
      expect(res).toEqual([{ id: 20, pieza: '2.1' }])
      expect(localStorageRepository.leerJSON).toHaveBeenCalledWith('quirurgico_endodoncia_pac-1', [])
    })
  })

  describe('guardarEndodonciasDePaciente', () => {
    it('retorna false si pacienteId es falsy', async () => {
      const res = await quirurgicoStorageService.guardarEndodonciasDePaciente('', [])
      expect(res).toBe(false)
    })

    it('guarda en Supabase y localStorage', async () => {
      vi.mocked(localStorageRepository.escribirJSON).mockReturnValue(true)
      const res = await quirurgicoStorageService.guardarEndodonciasDePaciente('pac-1', [{ id: 10 }])
      expect(res).toBe(true)
      expect(datosClinicosSupabase.guardarDatoGenerico).toHaveBeenCalledWith('pac-1', 'quirurgico_endodoncia', [{ id: 10 }])
      expect(localStorageRepository.escribirJSON).toHaveBeenCalledWith('quirurgico_endodoncia_pac-1', [{ id: 10 }])
    })
  })

  describe('eliminarDatosDePaciente', () => {
    it('no falla si pacienteId es null', () => {
      expect(() => quirurgicoStorageService.eliminarDatosDePaciente(null)).not.toThrow()
    })

    it('remueve ambas claves de localStorage', () => {
      localStorage.setItem('quirurgico_implantes_pac-1', 'test')
      localStorage.setItem('quirurgico_endodoncia_pac-1', 'test')
      quirurgicoStorageService.eliminarDatosDePaciente('pac-1')
      expect(localStorage.getItem('quirurgico_implantes_pac-1')).toBeNull()
      expect(localStorage.getItem('quirurgico_endodoncia_pac-1')).toBeNull()
    })
  })
})
