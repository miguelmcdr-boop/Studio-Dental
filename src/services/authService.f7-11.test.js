/**
 * F7-11: Tests de gestión de invitaciones de miembros
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de supabaseClient
vi.mock('./supabaseClient', () => ({
  USE_SUPABASE: true,
  supabase: {
    rpc: vi.fn()
  }
}))

import { 
  invitarMiembro, 
  listarInvitaciones, 
  revocarInvitacion, 
  aceptarInvitacion,
  generarUrlInvitacion 
} from './authService'
import { supabase } from './supabaseClient'

describe('F7-11: invitarMiembro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe invitar miembro exitosamente', async () => {
    supabase.rpc.mockResolvedValue({ 
      data: 'invitacion-uuid-123', 
      error: null 
    })

    const result = await invitarMiembro('empleado@test.com', 'dentista')

    expect(result.success).toBe(true)
    expect(result.invitacionId).toBe('invitacion-uuid-123')
    expect(supabase.rpc).toHaveBeenCalledWith('invitar_miembro', {
      p_email: 'empleado@test.com',
      p_rol: 'dentista'
    })
  })

  it('debe normalizar email a minúsculas', async () => {
    supabase.rpc.mockResolvedValue({ data: 'uuid', error: null })

    await invitarMiembro('EMPLEADO@TEST.COM', 'dentista')

    expect(supabase.rpc).toHaveBeenCalledWith('invitar_miembro', {
      p_email: 'empleado@test.com',
      p_rol: 'dentista'
    })
  })

  it('debe rechazar email inválido', async () => {
    const result = await invitarMiembro('invalid-email', 'dentista')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Email inválido')
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('debe rechazar rol inválido', async () => {
    const result = await invitarMiembro('empleado@test.com', 'superadmin')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Rol inválido')
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('debe traducir error PERMISO_DENEGADO', async () => {
    supabase.rpc.mockResolvedValue({ 
      data: null, 
      error: { message: 'PERMISO_DENEGADO: solo administradores' } 
    })

    const result = await invitarMiembro('empleado@test.com', 'dentista')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Solo administradores pueden invitar miembros')
  })

  it('debe traducir error de miembro existente', async () => {
    supabase.rpc.mockResolvedValue({ 
      data: null, 
      error: { message: 'Este email ya es miembro activo de la clínica' } 
    })

    const result = await invitarMiembro('empleado@test.com', 'dentista')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Este email ya es miembro de la clínica')
  })

  it('debe manejar excepciones', async () => {
    supabase.rpc.mockRejectedValue(new Error('Network error'))

    const result = await invitarMiembro('empleado@test.com', 'dentista')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })
})

describe('F7-11: listarInvitaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe listar invitaciones exitosamente', async () => {
    const mockInvitaciones = [
      { id: 'inv-1', email: 'a@test.com', rol: 'dentista', status: 'pending' },
      { id: 'inv-2', email: 'b@test.com', rol: 'recepcion', status: 'pending' }
    ]
    supabase.rpc.mockResolvedValue({ data: mockInvitaciones, error: null })

    const result = await listarInvitaciones()

    expect(result.success).toBe(true)
    expect(result.invitaciones).toHaveLength(2)
    expect(result.invitaciones[0].email).toBe('a@test.com')
  })

  it('debe retornar array vacío si no hay invitaciones', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null })

    const result = await listarInvitaciones()

    expect(result.success).toBe(true)
    expect(result.invitaciones).toEqual([])
  })

  it('debe manejar errores', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const result = await listarInvitaciones()

    expect(result.success).toBe(false)
    expect(result.error).toBe('DB error')
  })
})

describe('F7-11: revocarInvitacion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe revocar invitación exitosamente', async () => {
    supabase.rpc.mockResolvedValue({ data: true, error: null })

    const result = await revocarInvitacion('invitacion-uuid-123')

    expect(result.success).toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith('revocar_invitacion', {
      p_invitacion_id: 'invitacion-uuid-123'
    })
  })

  it('debe rechazar ID vacío', async () => {
    const result = await revocarInvitacion(null)

    expect(result.success).toBe(false)
    expect(result.error).toBe('ID de invitación requerido')
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('debe traducir error PERMISO_DENEGADO', async () => {
    supabase.rpc.mockResolvedValue({ 
      data: null, 
      error: { message: 'PERMISO_DENEGADO: solo administradores' } 
    })

    const result = await revocarInvitacion('invitacion-uuid-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Solo administradores pueden revocar invitaciones')
  })
})

describe('F7-11: aceptarInvitacion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe aceptar invitación exitosamente', async () => {
    supabase.rpc.mockResolvedValue({ data: 'clinica-uuid-456', error: null })

    const result = await aceptarInvitacion('token-seguro-abc123')

    expect(result.success).toBe(true)
    expect(result.clinicaId).toBe('clinica-uuid-456')
    expect(supabase.rpc).toHaveBeenCalledWith('aceptar_invitacion', {
      p_token: 'token-seguro-abc123'
    })
  })

  it('debe rechazar token vacío', async () => {
    const result = await aceptarInvitacion(null)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Token inválido')
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('debe traducir error INVITACION_EXPIRADA', async () => {
    supabase.rpc.mockResolvedValue({ 
      data: null, 
      error: { message: 'INVITACION_EXPIRADA' } 
    })

    const result = await aceptarInvitacion('token-expirado')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Esta invitación ya expiró')
  })

  it('debe traducir error EMAIL_NO_COINCIDE', async () => {
    supabase.rpc.mockResolvedValue({ 
      data: null, 
      error: { message: 'EMAIL_NO_COINCIDE' } 
    })

    const result = await aceptarInvitacion('token-otro-email')

    expect(result.success).toBe(false)
    expect(result.error).toContain('otro email')
  })

  it('debe traducir error YA_ES_MIEMBRO', async () => {
    supabase.rpc.mockResolvedValue({ 
      data: null, 
      error: { message: 'YA_ES_MIEMBRO' } 
    })

    const result = await aceptarInvitacion('token-duplicado')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Ya eres miembro de esta clínica')
  })
})

describe('F7-11: generarUrlInvitacion', () => {
  it('debe generar URL con token', () => {
    // Mock window.location
    const originalLocation = window.location
    delete window.location
    window.location = { origin: 'http://localhost:5173' }

    const url = generarUrlInvitacion('token-abc123')

    expect(url).toBe('http://localhost:5173/#/aceptar-invita?token=token-abc123')

    // Restaurar
    window.location = originalLocation
  })

  it('debe escapar caracteres especiales del token', () => {
    const originalLocation = window.location
    delete window.location
    window.location = { origin: 'http://localhost:5173' }

    const url = generarUrlInvitacion('token/con&especiales=')

    expect(url).toContain('token=token%2Fcon%26especiales%3D')

    window.location = originalLocation
  })
})
