import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks definidos con vi.hoisted() para que existan antes de vi.mock()
const mocks = vi.hoisted(() => ({
  mockGuardarCertificados: vi.fn(() => Promise.resolve(true)),
  mockObtenerCertificados: vi.fn(() => []),
  mockEliminaArchivo: vi.fn(() => Promise.resolve(true)),
  mockSupabaseFrom: vi.fn(() => ({
    select: vi.fn(() => ({
      not: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}))

vi.mock('./certificadosStorageService', () => ({
  certificadosStorageService: {
    obtenerCertificados: mocks.mockObtenerCertificados,
    guardarCertificados: mocks.mockGuardarCertificados
  }
}))

vi.mock('../../../services/r2ArchivosService', () => ({
  eliminaArchivo: mocks.mockEliminaArchivo
}))

vi.mock('../../../services/supabaseClient', () => ({
  supabase: { from: mocks.mockSupabaseFrom },
  USE_SUPABASE: true
}))

vi.mock('../../../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
  })
}))

import {
  diasRestantes,
  obtenerCertificadosEliminados,
  restaurarCertificado,
  eliminarDefinitivo,
  vaciarPapelera
} from './papeleraCertificadosService'

describe('papeleraCertificadosService (M3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('diasRestantes', () => {
    it('calcula días restantes desde fecha ISO reciente', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      const dias = diasRestantes(ayer.toISOString())
      expect(dias).toBeGreaterThanOrEqual(728)
      expect(dias).toBeLessThanOrEqual(730)
    })

    it('retorna 0 si han pasado más de 730 días', () => {
      const antigua = new Date()
      antigua.setFullYear(antigua.getFullYear() - 3)
      const dias = diasRestantes(antigua.toISOString())
      expect(dias).toBe(0)
    })

    it('retorna null si fecha es null o inválida', () => {
      expect(diasRestantes(null)).toBeNull()
      expect(diasRestantes('invalida')).toBeNull()
    })

    it('clampea a 730 si la fecha es futura', () => {
      const futura = new Date()
      futura.setFullYear(futura.getFullYear() + 1)
      const dias = diasRestantes(futura.toISOString())
      expect(dias).toBe(730)
    })
  })

  describe('obtenerCertificadosEliminados', () => {
    it('filtra solo certificados con eliminadoAt', () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: '1', tipo: 'asistencia' },
        { id: '2', tipo: 'reposo', eliminadoAt: '2026-09-14T10:00:00Z' },
        { id: '3', tipo: 'asistencia', eliminadoAt: null }
      ])

      const result = obtenerCertificadosEliminados('pac-123')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('retorna array vacío si no hay pacienteId', () => {
      expect(obtenerCertificadosEliminados(null)).toEqual([])
    })
  })

  describe('restaurarCertificado', () => {
    it('restaura certificado en papelera (limpia metadata)', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', eliminadoAt: '2026-09-14T10:00:00Z', eliminadoPor: 'user-1', eliminadoMotivo: 'X' },
        { id: 'cert-2' }
      ])

      const ok = await restaurarCertificado('pac-123', 'cert-1')

      expect(ok).toBe(true)
      expect(mocks.mockGuardarCertificados).toHaveBeenCalled()
      const guardados = mocks.mockGuardarCertificados.mock.calls[0][1]
      const restaurado = guardados.find(c => c.id === 'cert-1')
      expect(restaurado.eliminadoAt).toBeNull()
      expect(restaurado.eliminadoPor).toBeNull()
      expect(restaurado.eliminadoMotivo).toBeNull()
    })

    it('retorna false si cert no está en papelera', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([{ id: 'cert-1' }])

      const ok = await restaurarCertificado('pac-123', 'cert-1')

      expect(ok).toBe(false)
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })
  })

  describe('eliminarDefinitivo', () => {
    it('elimina PDF de R2 si tiene r2ArchivoId', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(true)
      expect(mocks.mockEliminaArchivo).toHaveBeenCalledWith('r2-arch-123')
      expect(mocks.mockSupabaseFrom).toHaveBeenCalledWith('certificados')
    })

    it('no llama a eliminaArchivo si no tiene r2ArchivoId', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(true)
      expect(mocks.mockEliminaArchivo).not.toHaveBeenCalled()
    })

    it('continúa si R2 falla pero elimina de Supabase', async () => {
      mocks.mockEliminaArchivo.mockResolvedValue(false)
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(true)
      expect(mocks.mockSupabaseFrom).toHaveBeenCalledWith('certificados')
    })

    it('retorna false si cert no encontrado', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([])

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(false)
    })
  })

  describe('vaciarPapelera', () => {
    it('elimina todos los certificados en papelera', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', eliminadoAt: '2026-09-14T10:00:00Z' },
        { id: 'cert-2', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])

      const count = await vaciarPapelera('pac-123')

      expect(count).toBe(2)
    })

    it('retorna 0 si no hay certificados en papelera', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([])

      const count = await vaciarPapelera('pac-123')

      expect(count).toBe(0)
    })
  })
})
