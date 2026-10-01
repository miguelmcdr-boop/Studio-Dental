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
    it('retorna el rol desde app_metadata tras el registro', async () => {
      supabase.auth.signUp.mockResolvedValue({ error: null })
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { user_metadata: { full_name: 'Nuevo' }, app_metadata: { role: 'asistente' } } },
      })
      const r = await supabaseSignUp('nuevo@test.com', 'pass123', { nombreCompleto: 'Nuevo', rol: 'asistente' })
      expect(r.success).toBe(true)
      expect(r.userMetadata.role).toBe('asistente')
    })
  })
})
