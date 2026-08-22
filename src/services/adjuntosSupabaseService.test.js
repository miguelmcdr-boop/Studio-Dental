/**
 * Tests — adjuntosSupabaseService (F6-E)
 *
 * Valida subida, URL firmada, eliminación y listado de adjuntos
 * en Supabase Storage con mocks de supabaseClient.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  subirAdjunto,
  obtenerUrlFirmada,
  eliminarAdjuntoDeStorage,
  listarArchivosDePaciente,
  storageDisponible
} from './adjuntosSupabaseService'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn()
    }
  },
  USE_SUPABASE: true
}))

const CLINICA_ID = 'clinica-uuid-123'
const PACIENTE_ID = 'paciente-uuid-456'

describe('adjuntosSupabaseService (F6-E)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('subirAdjunto', () => {
    it('sube un archivo y retorna path', async () => {
      supabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null })
      })

      const blob = new Blob(['contenido'], { type: 'image/png' })
      const resultado = await subirAdjunto({
        clinicaId: CLINICA_ID,
        pacienteId: PACIENTE_ID,
        tipo: 'foto',
        blob,
        nombre: 'foto1.png'
      })

      expect(resultado).not.toBeNull()
      expect(resultado.path).toContain(CLINICA_ID)
      expect(resultado.path).toContain(PACIENTE_ID)
      expect(resultado.path).toContain('foto')
      expect(resultado.path).toContain('foto1.png')
      expect(resultado.idArchivo).toBeDefined()
      expect(supabase.storage.from).toHaveBeenCalledWith('adjuntos-clinicos')
    })

    it('retorna null si faltan parámetros obligatorios', async () => {
      const blob = new Blob(['contenido'], { type: 'image/png' })

      expect(await subirAdjunto({ pacienteId: PACIENTE_ID, tipo: 'foto', blob, nombre: 'x.png' })).toBeNull()
      expect(await subirAdjunto({ clinicaId: CLINICA_ID, tipo: 'foto', blob, nombre: 'x.png' })).toBeNull()
      expect(await subirAdjunto({ clinicaId: CLINICA_ID, pacienteId: PACIENTE_ID, blob, nombre: 'x.png' })).toBeNull()
      expect(await subirAdjunto({ clinicaId: CLINICA_ID, pacienteId: PACIENTE_ID, tipo: 'foto', nombre: 'x.png' })).toBeNull()
    })

    it('retorna null si Supabase retorna error', async () => {
      supabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Storage full' } })
      })

      const blob = new Blob(['contenido'], { type: 'image/png' })
      const resultado = await subirAdjunto({
        clinicaId: CLINICA_ID,
        pacienteId: PACIENTE_ID,
        tipo: 'rx',
        blob,
        nombre: 'rx1.dcm'
      })

      expect(resultado).toBeNull()
    })

    it('sanitiza nombre de archivo con caracteres especiales', async () => {
      supabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null })
      })

      const blob = new Blob(['contenido'], { type: 'application/pdf' })
      const resultado = await subirAdjunto({
        clinicaId: CLINICA_ID,
        pacienteId: PACIENTE_ID,
        tipo: 'consentimiento',
        blob,
        nombre: 'con/sentimiento\\firmado 2026.pdf'
      })

      expect(resultado).not.toBeNull()
      expect(resultado.path).not.toContain('\\')
      // El nombre se sanitiza: / y \ se reemplazan por _
      expect(resultado.path).toContain('con_sentimiento_firmado-2026.pdf')
    })
  })

  describe('obtenerUrlFirmada', () => {
    it('genera URL firmada para un path válido', async () => {
      const urlEsperada = 'https://storage.supabase.co/signed/adjuntos-clinicos/test?token=abc123'
      supabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: urlEsperada },
          error: null
        })
      })

      const url = await obtenerUrlFirmada('clinica/paciente/foto/archivo.png', 3600)

      expect(url).toBe(urlEsperada)
      expect(supabase.storage.from).toHaveBeenCalledWith('adjuntos-clinicos')
    })

    it('retorna null si path es vacío', async () => {
      expect(await obtenerUrlFirmada('')).toBeNull()
      expect(await obtenerUrlFirmada(null)).toBeNull()
      expect(await obtenerUrlFirmada(undefined)).toBeNull()
    })

    it('retorna null si Supabase retorna error', async () => {
      supabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      })

      const url = await obtenerUrlFirmada('clinica/paciente/foto/archivo.png')
      expect(url).toBeNull()
    })
  })

  describe('eliminarAdjuntoDeStorage', () => {
    it('elimina archivo correctamente', async () => {
      supabase.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null })
      })

      const resultado = await eliminarAdjuntoDeStorage('clinica/paciente/foto/archivo.png')
      expect(resultado).toBe(true)
    })

    it('retorna true si path es vacío (no-op)', async () => {
      expect(await eliminarAdjuntoDeStorage('')).toBe(true)
      expect(await eliminarAdjuntoDeStorage(null)).toBe(true)
    })

    it('retorna false si Supabase retorna error', async () => {
      supabase.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: { message: 'Permission denied' } })
      })

      const resultado = await eliminarAdjuntoDeStorage('clinica/paciente/foto/archivo.png')
      expect(resultado).toBe(false)
    })
  })

  describe('listarArchivosDePaciente', () => {
    it('lista archivos agrupados por tipo', async () => {
      supabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'archivo1.png', created_at: '2026-08-20' }],
          error: null
        })
      })

      const archivos = await listarArchivosDePaciente(CLINICA_ID, PACIENTE_ID)

      // Se llama a list() 3 veces (foto, rx, consentimiento)
      expect(archivos.length).toBeGreaterThanOrEqual(3)
      expect(archivos[0].tipo).toBeDefined()
      expect(archivos[0].path).toContain(CLINICA_ID)
    })

    it('retorna array vacío si faltan parámetros', async () => {
      expect(await listarArchivosDePaciente('', PACIENTE_ID)).toEqual([])
      expect(await listarArchivosDePaciente(CLINICA_ID, '')).toEqual([])
      expect(await listarArchivosDePaciente(null, null)).toEqual([])
    })

    it('retorna array vacío si Supabase falla', async () => {
      supabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' }
        })
      })

      const archivos = await listarArchivosDePaciente(CLINICA_ID, PACIENTE_ID)
      expect(archivos).toEqual([])
    })
  })

  describe('storageDisponible', () => {
    it('retorna true cuando USE_SUPABASE es true y supabase existe', () => {
      expect(storageDisponible()).toBe(true)
    })
  })
})
