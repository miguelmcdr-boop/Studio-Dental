import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mocks definidos con vi.hoisted() para que existan antes de vi.mock()
const mocks = vi.hoisted(() => ({
  mockGetUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } } })),
  mockGuardarCertificados: vi.fn(() => Promise.resolve(true)),
  mockObtenerCertificados: vi.fn(() => []),
  mockRestaurarCertificado: vi.fn(() => Promise.resolve(true)),
  mockEliminarDefinitivo: vi.fn(() => Promise.resolve(true))
}))

vi.mock('../../../services/supabaseClient', () => ({
  supabase: {
    auth: { getUser: mocks.mockGetUser }
  }
}))

vi.mock('../services/certificadosStorageService', () => ({
  certificadosStorageService: {
    guardarCertificados: mocks.mockGuardarCertificados,
    obtenerCertificados: mocks.mockObtenerCertificados
  }
}))

vi.mock('../services/papeleraCertificadosService', () => ({
  restaurarCertificado: mocks.mockRestaurarCertificado,
  eliminarDefinitivo: mocks.mockEliminarDefinitivo
}))

vi.mock('../../../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
  })
}))

import { usePapeleraCertificados } from './usePapeleraCertificados'

describe('usePapeleraCertificados (M3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockObtenerCertificados.mockReturnValue([])
  })

  describe('inicialización', () => {
    it('inicializa con papelera cerrada y listas vacías', () => {
      const setCertificados = vi.fn()
      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', [], setCertificados)
      )

      expect(result.current.papeleraAbierta).toBe(false)
      expect(result.current.certificadosActivos).toEqual([])
      expect(result.current.hayEliminados).toBe(false)
    })

    it('obtiene user.id al montar', async () => {
      const setCertificados = vi.fn()
      renderHook(() =>
        usePapeleraCertificados('pac-1', [], setCertificados)
      )

      await waitFor(() => {
        expect(mocks.mockGetUser).toHaveBeenCalled()
      })
    })
  })

  describe('filtrado de certificados', () => {
    it('certificadosActivos filtra los eliminados', () => {
      const setCertificados = vi.fn()
      const certs = [
        { id: '1', tipo: 'asistencia' },
        { id: '2', tipo: 'reposo', eliminadoAt: '2026-09-14T10:00:00Z' },
        { id: '3', tipo: 'asistencia' }
      ]
      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', certs, setCertificados)
      )

      expect(result.current.certificadosActivos).toHaveLength(2)
      expect(result.current.certificadosActivos.map(c => c.id)).toEqual(['1', '3'])
    })

    it('hayEliminados es true cuando hay algún cert en papelera', () => {
      const setCertificados = vi.fn()
      const certs = [
        { id: '1', tipo: 'asistencia' },
        { id: '2', tipo: 'reposo', eliminadoAt: '2026-09-14T10:00:00Z' }
      ]
      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', certs, setCertificados)
      )

      expect(result.current.hayEliminados).toBe(true)
    })

    it('hayEliminados es false cuando no hay certs en papelera', () => {
      const setCertificados = vi.fn()
      const certs = [{ id: '1', tipo: 'asistencia' }]
      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', certs, setCertificados)
      )

      expect(result.current.hayEliminados).toBe(false)
    })
  })

  describe('moverAPapelera', () => {
    it('setea eliminadoAt, eliminadoPor y eliminadoMotivo', async () => {
      const setCertificados = vi.fn()
      const certs = [{ id: 'cert-1', tipo: 'asistencia' }]
      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', certs, setCertificados)
      )

      await act(async () => {
        await result.current.moverAPapelera('cert-1', 'Motivo test')
      })

      expect(setCertificados).toHaveBeenCalled()
      const actualizados = setCertificados.mock.calls[0][0]
      const movido = actualizados.find(c => c.id === 'cert-1')
      expect(movido.eliminadoAt).toBeTruthy()
      expect(movido.eliminadoMotivo).toBe('Motivo test')
      expect(mocks.mockGuardarCertificados).toHaveBeenCalledWith('pac-1', actualizados)
    })

    it('usa motivo por defecto si no se proporciona', async () => {
      const setCertificados = vi.fn()
      const certs = [{ id: 'cert-1', tipo: 'asistencia' }]
      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', certs, setCertificados)
      )

      await act(async () => {
        await result.current.moverAPapelera('cert-1')
      })

      const actualizados = setCertificados.mock.calls[0][0]
      const movido = actualizados.find(c => c.id === 'cert-1')
      expect(movido.eliminadoMotivo).toBe('Movido a papelera')
    })

    it('retorna false si certificados no es array', async () => {
      const setCertificados = vi.fn()
      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', null, setCertificados)
      )

      const ok = await act(async () => {
        return result.current.moverAPapelera('cert-1')
      })

      expect(ok).toBe(false)
    })
  })

  describe('abrirPapelera / cerrarPapelera', () => {
    it('cambia estado del modal', async () => {
      const setCertificados = vi.fn()
      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', [], setCertificados)
      )

      expect(result.current.papeleraAbierta).toBe(false)

      await act(async () => {
        result.current.abrirPapelera()
      })
      expect(result.current.papeleraAbierta).toBe(true)

      await act(async () => {
        result.current.cerrarPapelera()
      })
      expect(result.current.papeleraAbierta).toBe(false)
    })
  })

  describe('restaurar', () => {
    it('delega al service y recarga certificados', async () => {
      const setCertificados = vi.fn()
      mocks.mockObtenerCertificados.mockReturnValue([{ id: 'cert-1' }])

      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', [], setCertificados)
      )

      await act(async () => {
        const ok = await result.current.restaurar('cert-1')
        expect(ok).toBe(true)
      })

      expect(mocks.mockRestaurarCertificado).toHaveBeenCalledWith('pac-1', 'cert-1')
      expect(setCertificados).toHaveBeenCalled()
    })
  })

  describe('eliminarDefinitivo', () => {
    it('delega al service y recarga certificados', async () => {
      const setCertificados = vi.fn()
      mocks.mockObtenerCertificados.mockReturnValue([])

      const { result } = renderHook(() =>
        usePapeleraCertificados('pac-1', [], setCertificados)
      )

      await act(async () => {
        const ok = await result.current.eliminarDefinitivo('cert-1')
        expect(ok).toBe(true)
      })

      expect(mocks.mockEliminarDefinitivo).toHaveBeenCalledWith('pac-1', 'cert-1')
      expect(setCertificados).toHaveBeenCalled()
    })
  })
})
