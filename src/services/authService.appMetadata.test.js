import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./supabaseClient', () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  }
  return { supabase: mockSupabase, USE_SUPABASE: true }
})

import { supabaseSignIn, supabaseSignUp } from './authService'
import { supabase } from './supabaseClient'

describe('F6-B4: authService lee rol de app_metadata', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('supabaseSignIn', () => {
    it('retorna el rol desde app_metadata cuando existe', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { user_metadata: { full_name: 'Test' }, app_metadata: { role: 'dentista' } } },
      })
      const r = await supabaseSignIn('dentista@test.com', 'pass123')
      expect(r.success).toBe(true)
      expect(r.userMetadata.role).toBe('dentista')
      expect(r.userMetadata.full_name).toBe('Test')
    })

    it('default a recepcion (NO admin) si falta app_metadata.role', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { user_metadata: {}, app_metadata: {} } },
      })
      const r = await supabaseSignIn('user@test.com', 'pass123')
      expect(r.success).toBe(true)
      expect(r.userMetadata.role).toBe('recepcion')
      expect(r.userMetadata.role).not.toBe('admin')
    })

    it('NO llama a updateUser durante el login', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { user_metadata: {}, app_metadata: {} } },
      })
      await supabaseSignIn('user@test.com', 'pass123')
      expect(supabase.auth.updateUser).not.toHaveBeenCalled()
    })
  })

  describe('supabaseSignUp', () => {
    it('retorna el rol desde app_metadata tras el registro (flujo invitación)', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { session: { access_token: 'x' }, user: {} },
        error: null,
      })
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { user_metadata: { full_name: 'Nuevo' }, app_metadata: { role: 'asistente' } } },
      })
      // P0-2: el signup solo está permitido con token de invitación
      const r = await supabaseSignUp('nuevo@test.com', 'pass123', { nombreCompleto: 'Nuevo', rol: 'asistente', inviteToken: 'inv-token' })
      expect(r.success).toBe(true)
      expect(r.userMetadata.role).toBe('asistente')
      expect(supabase.auth.signUp.mock.calls[0][0].options.invite_token).toBe('inv-token')
    })

    it('P0-2: bloquea el signup sin token de invitación ni flag bootstrap (sin registro abierto)', async () => {
      const r = await supabaseSignUp('cualquiera@test.com', 'pass123', { nombreCompleto: 'X' })
      expect(r.success).toBe(false)
      expect(r.error).toMatch(/invitación/i)
      expect(supabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('F7-11b: permite signup self-service del dueño con bootstrapClinica=true', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { session: null, user: { id: 'u1' } },
        error: null,
      })
      const r = await supabaseSignUp('dueno@test.com', 'pass123', { nombreCompleto: 'Dueño', bootstrapClinica: true })
      // Con confirmación de email activada no hay sesión inmediata → pide confirmar
      expect(r.success).toBe(false)
      expect(r.requiresEmailConfirmation).toBe(true)
      expect(supabase.auth.signUp).toHaveBeenCalled()
    })

    it('P0-1: si no hay sesión tras signUp (falta confirmar email), no reporta éxito', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { session: null, user: { id: 'u1' } },
        error: null,
      })
      const r = await supabaseSignUp('nuevo@test.com', 'pass123', { inviteToken: 'inv-token' })
      expect(r.success).toBe(false)
      expect(r.requiresEmailConfirmation).toBe(true)
    })
  })
})
