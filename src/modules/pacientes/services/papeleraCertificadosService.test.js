import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
  })),
  // F7-37 v4 H-12: mocks para auth y fetch (arquitectura archivos-purge)
  mockGetSession: vi.fn(() => Promise.resolve({
    data: { session: { access_token: 'test-jwt-token' } },
    error: null
  })),
  mockFetch: vi.fn(),
  mockPacientesStorageGuardarItem: vi.fn()
}))

vi.mock('./certificadosStorageService', () => ({
  certificadosStorageService: {
    obtenerCertificados: mocks.mockObtenerCertificados,
    guardarCertificados: mocks.mockGuardarCertificados
  }
}))

vi.mock('./pacientesStorageService', () => ({
  pacientesStorageService: {
    guardarItem: mocks.mockPacientesStorageGuardarItem
  }
}))

vi.mock('../../../services/r2ArchivosService', () => ({
  eliminaArchivo: mocks.mockEliminaArchivo
}))

// F7-37 v4 H-12: mock de supabaseClient incluye auth, from, USE_SUPABASE, supabaseUrl
vi.mock('../../../services/supabaseClient', () => ({
  supabase: {
    from: mocks.mockSupabaseFrom,
    auth: { getSession: mocks.mockGetSession }
  },
  USE_SUPABASE: true,
  supabaseUrl: 'https://test.supabase.co'
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
    // F7-37 v4 H-12: configurar fetch mock por defecto (éxito)
    globalThis.fetch = mocks.mockFetch
    mocks.mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        purgados: ['r2-arch-123'],
        rechazados: []
      })
    })
    // F7-37 v4 H-12: sesión por defecto
    mocks.mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-jwt-token' } },
      error: null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1' } // sin eliminadoAt
      ])

      const ok = await restaurarCertificado('pac-123', 'cert-1')

      expect(ok).toBe(false)
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })
  })

  describe('eliminarDefinitivo', () => {
    it('retorna false si cert no encontrado', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([])

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(false)
      expect(mocks.mockFetch).not.toHaveBeenCalled()
    })

    it('retorna false si cert no está en papelera (sin eliminadoAt)', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123' } // sin eliminadoAt
      ])

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(false)
      expect(mocks.mockFetch).not.toHaveBeenCalled()
    })

    // ============================================================
    // F7-37 v4 H-12: NUEVOS TESTS con arquitectura archivos-purge
    // ============================================================

    it('T48: eliminación exitosa vía archivos-purge con source_type=certificado', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z', tipo: 'asistencia' }
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          purgados: ['r2-arch-123'],
          rechazados: []
        })
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(true)
      // Verificar que se llamó a archivos-purge con payload correcto
      expect(mocks.mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mocks.mockFetch.mock.calls[0]
      expect(url).toContain('/functions/v1/archivos-purge')
      expect(options.method).toBe('POST')
      const body = JSON.parse(options.body)
      expect(body.archivo_ids).toEqual(['r2-arch-123'])
      expect(body.source_type).toBe('certificado')
      expect(body.source_ids).toEqual({ 'r2-arch-123': 'cert-1' })
      // Verificar Authorization header
      expect(options.headers.Authorization).toBe('Bearer test-jwt-token')
      // NO debe usar eliminaArchivo (arquitectura antigua)
      expect(mocks.mockEliminaArchivo).not.toHaveBeenCalled()
      // NO debe usar supabase.from.delete (arquitectura antigua para con R2)
      expect(mocks.mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('T67: fail-closed para certificado sin R2 si archivos-purge falla', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', eliminadoAt: '2026-09-14T10:00:00Z' } // sin r2ArchivoId
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error')
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      // Fail-closed: si archivos-purge falla, certificado NO se elimina
      expect(ok).toBe(false)
      // Caché local NO se actualiza
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })

    it('T68: certificado sin R2 - archivos-purge rechaza por validación server-side', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', eliminadoAt: '2026-09-14T10:00:00Z' } // sin r2ArchivoId
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          purgados: [],
          rechazados: [{ id: 'cert-1', razon: 'certificado_no_en_papelera' }]
        })
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      // Fail-closed: si archivos-purge rechaza, certificado NO se elimina
      expect(ok).toBe(false)
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })


    it('T49: fail-closed - si archivos-purge falla, certificado NO se elimina', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error')
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      // Fail-closed: NO elimina el certificado si archivos-purge falla
      expect(ok).toBe(false)
      // Caché local NO se actualiza
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })

    it('T49b: fail-closed - si archivos-purge rechaza, certificado NO se elimina', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          purgados: [], // vacío: archivos-purge rechazó el archivo
          rechazados: [{ id: 'r2-arch-123', razon: 'certificado_cross_tenant' }]
        })
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(false)
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })

    it('T50: idempotente - si R2 ya fue eliminado (404), se considera éxito', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])
      // archivos-purge trata 404 como idempotente y reporta éxito
      mocks.mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          purgados: ['r2-arch-123'],
          rechazados: []
        })
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(true)
    })

    it('T51: sin sesión activa → retorna false sin llamar archivos-purge', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])
      mocks.mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(false)
      expect(mocks.mockFetch).not.toHaveBeenCalled()
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })

    it('T52: cross-tenant - archivos-purge rechaza y retorna false', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])
      // archivos-purge detecta que el certificado es de otra clínica
      mocks.mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          purgados: [],
          rechazados: [{ id: 'r2-arch-123', razon: 'certificado_cross_tenant' }]
        })
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(false)
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })

    it('T53: sin rol autorizado - archivos-purge retorna 403', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' }
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Insufficient permissions')
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(false)
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })

    it('certificado SIN r2ArchivoId → llama a archivos-purge con archivo_ids=[] (H-12)', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', eliminadoAt: '2026-09-14T10:00:00Z' } // sin r2ArchivoId
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          purgados: ['cert-1'],
          rechazados: []
        })
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(true)
      // F7-37 v5 H-12: Ahora SÍ llama a archivos-purge (unificado)
      expect(mocks.mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mocks.mockFetch.mock.calls[0]
      expect(url).toContain('/functions/v1/archivos-purge')
      const body = JSON.parse(options.body)
      expect(body.archivo_ids).toEqual([])
      expect(body.source_type).toBe('certificado')
      expect(body.certificado_id).toBe('cert-1')
      // NO debe usar DELETE directo (arquitectura antigua)
      expect(mocks.mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('T67: fail-closed para certificado sin R2 si archivos-purge falla', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', eliminadoAt: '2026-09-14T10:00:00Z' } // sin r2ArchivoId
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error')
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      // Fail-closed: si archivos-purge falla, certificado NO se elimina
      expect(ok).toBe(false)
      // Caché local NO se actualiza
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })

    it('T68: certificado sin R2 - archivos-purge rechaza por validación server-side', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', eliminadoAt: '2026-09-14T10:00:00Z' } // sin r2ArchivoId
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          purgados: [],
          rechazados: [{ id: 'cert-1', razon: 'certificado_no_en_papelera' }]
        })
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      // Fail-closed: si archivos-purge rechaza, certificado NO se elimina
      expect(ok).toBe(false)
      expect(mocks.mockGuardarCertificados).not.toHaveBeenCalled()
    })


    it('actualiza caché local solo si éxito', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-arch-123', eliminadoAt: '2026-09-14T10:00:00Z' },
        { id: 'cert-2', r2ArchivoId: 'r2-arch-456', eliminadoAt: '2026-09-14T11:00:00Z' }
      ])
      mocks.mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          purgados: ['r2-arch-123'],
          rechazados: []
        })
      })

      const ok = await eliminarDefinitivo('pac-123', 'cert-1')

      expect(ok).toBe(true)
      // pacientesStorageService.guardarItem se llama con la lista filtrada
      expect(mocks.mockPacientesStorageGuardarItem).toHaveBeenCalled()
      const [key, lista] = mocks.mockPacientesStorageGuardarItem.mock.calls[0]
      expect(key).toBe('certificados_pac-123')
      expect(lista).toHaveLength(1)
      expect(lista[0].id).toBe('cert-2')
    })
  })

  describe('vaciarPapelera', () => {
    it('elimina todos los certificados en papelera', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1', r2ArchivoId: 'r2-1', eliminadoAt: '2026-09-14T10:00:00Z' },
        { id: 'cert-2', r2ArchivoId: 'r2-2', eliminadoAt: '2026-09-14T11:00:00Z' }
      ])
      // F7-37 v4 H-12: mock dinámico que devuelve el archivo solicitado en cada llamada
      mocks.mockFetch.mockImplementation(async (url, options) => {
        const body = JSON.parse(options.body)
        return {
          ok: true,
          json: () => Promise.resolve({
            success: true,
            purgados: body.archivo_ids, // purga los archivos solicitados
            rechazados: []
          })
        }
      })

      const count = await vaciarPapelera('pac-123')

      expect(count).toBe(2)
      expect(mocks.mockFetch).toHaveBeenCalledTimes(2)
    })

    it('retorna 0 si no hay certificados en papelera', async () => {
      mocks.mockObtenerCertificados.mockReturnValue([
        { id: 'cert-1' } // sin eliminadoAt
      ])

      const count = await vaciarPapelera('pac-123')

      expect(count).toBe(0)
      expect(mocks.mockFetch).not.toHaveBeenCalled()
    })
  })
})
