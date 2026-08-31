/**
 * F7-10b: Tests de obtenerRolEnClinicaActual
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de supabaseClient
vi.mock('./supabaseClient', () => ({
  USE_SUPABASE: true,
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn()
  }
}))

import { obtenerRolEnClinicaActual } from './authService'
import { supabase } from './supabaseClient'

describe('F7-10b: obtenerRolEnClinicaActual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe retornar el rol de la clínica activa', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    supabase.rpc.mockResolvedValue({ data: 'clinica-456', error: null })

    const mockSingle = vi.fn().mockResolvedValue({
      data: { rol: 'admin' },
      error: null
    })

    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              single: mockSingle
            })
          })
        })
      })
    })

    const rol = await obtenerRolEnClinicaActual()
    expect(rol).toBe('admin')
  })

  it('debe retornar null si no hay usuario', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    const rol = await obtenerRolEnClinicaActual()
    expect(rol).toBeNull()
  })

  it('debe retornar null si clinica_actual() retorna null', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    supabase.rpc.mockResolvedValue({ data: null, error: null })

    const rol = await obtenerRolEnClinicaActual()
    expect(rol).toBeNull()
  })

  it('debe retornar null si no hay membresía activa', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    supabase.rpc.mockResolvedValue({ data: 'clinica-456', error: null })

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'No rows found' }
    })

    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              single: mockSingle
            })
          })
        })
      })
    })

    const rol = await obtenerRolEnClinicaActual()
    expect(rol).toBeNull()
  })

  it('debe manejar excepciones gracefully', async () => {
    supabase.auth.getUser.mockRejectedValue(new Error('Network error'))

    const rol = await obtenerRolEnClinicaActual()
    expect(rol).toBeNull()
  })
})
