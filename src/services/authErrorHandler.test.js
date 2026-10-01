import { describe, it, expect, vi, beforeEach } from 'vitest'
import { esErrorAutenticacion, manejarErrorAuth, conManejoAuth } from './authErrorHandler'

describe('authErrorHandler (F6-H)', () => {
  describe('esErrorAutenticacion', () => {
    it('retorna false para null o undefined', () => {
      expect(esErrorAutenticacion(null)).toBe(false)
      expect(esErrorAutenticacion(undefined)).toBe(false)
    })

    it('detecta error con status 401', () => {
      expect(esErrorAutenticacion({ status: 401, message: 'Unauthorized' })).toBe(true)
    })

    it('detecta error con status 403', () => {
      expect(esErrorAutenticacion({ status: 403, message: 'Forbidden' })).toBe(true)
    })

    it('detecta código PGRST301 (JWT expired de PostgREST)', () => {
      expect(esErrorAutenticacion({ code: 'PGRST301', message: 'JWT expired' })).toBe(true)
    })

    it('detecta mensaje "JWT expired"', () => {
      expect(esErrorAutenticacion({ message: 'JWT expired' })).toBe(true)
      expect(esErrorAutenticacion({ message: 'jwt expired' })).toBe(true)
    })

    it('detecta mensaje "invalid token"', () => {
      expect(esErrorAutenticacion({ message: 'Invalid token provided' })).toBe(true)
    })

    it('detecta mensaje "refresh token not found"', () => {
      expect(esErrorAutenticacion({ message: 'refresh_token_not_found' })).toBe(true)
    })

    it('detecta mensaje "session not found"', () => {
      expect(esErrorAutenticacion({ message: 'Auth session missing' })).toBe(true)
    })

    it('NO detecta errores de red', () => {
      expect(esErrorAutenticacion({ message: 'Network error' })).toBe(false)
    })

    it('NO detecta errores de validación de datos', () => {
      expect(esErrorAutenticacion({ message: 'Column does not exist' })).toBe(false)
    })

    it('NO detecta errores de constraint unique', () => {
      expect(esErrorAutenticacion({ code: '23505', message: 'duplicate key' })).toBe(false)
    })
  })

  describe('manejarErrorAuth', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('ejecuta onLogout si el error es de autenticación', async () => {
      const onLogout = vi.fn().mockResolvedValue(undefined)
      const error = { status: 401, message: 'JWT expired' }

      const resultado = await manejarErrorAuth(error, onLogout)

      expect(resultado).toBe(true)
      expect(onLogout).toHaveBeenCalledTimes(1)
    })

    it('NO ejecuta onLogout si el error no es de autenticación', async () => {
      const onLogout = vi.fn()
      const error = { message: 'Network error' }

      const resultado = await manejarErrorAuth(error, onLogout)

      expect(resultado).toBe(false)
      expect(onLogout).not.toHaveBeenCalled()
    })

    it('maneja onLogout que lanza excepción', async () => {
      const onLogout = vi.fn().mockRejectedValue(new Error('logout failed'))
      const error = { status: 401, message: 'JWT expired' }

      // No debe lanzar
      const resultado = await manejarErrorAuth(error, onLogout)
      expect(resultado).toBe(true)
    })

    it('maneja onLogout que no es función', async () => {
      const error = { status: 401, message: 'JWT expired' }
      const resultado = await manejarErrorAuth(error, null)
      expect(resultado).toBe(true)
    })
  })

  describe('conManejoAuth', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('retorna resultado exitoso sin hacer logout', async () => {
      const onLogout = vi.fn()
      const resultado = await conManejoAuth(
        Promise.resolve({ data: [{ id: 1 }], error: null }),
        onLogout
      )

      expect(resultado.data).toHaveLength(1)
      expect(onLogout).not.toHaveBeenCalled()
    })

    it('hace logout si la query retorna error de autenticación', async () => {
      const onLogout = vi.fn().mockResolvedValue(undefined)
      const resultado = await conManejoAuth(
        Promise.resolve({ data: null, error: { status: 401, message: 'JWT expired' } }),
        onLogout
      )

      expect(resultado.error.status).toBe(401)
      expect(onLogout).toHaveBeenCalledTimes(1)
    })

    it('NO hace logout si la query retorna error de otro tipo', async () => {
      const onLogout = vi.fn()
      await conManejoAuth(
        Promise.resolve({ data: null, error: { message: 'Network error' } }),
        onLogout
      )

      expect(onLogout).not.toHaveBeenCalled()
    })

    it('hace logout si la query lanza excepción de auth', async () => {
      const onLogout = vi.fn().mockResolvedValue(undefined)

      await expect(
        conManejoAuth(
          Promise.reject({ status: 401, message: 'JWT expired' }),
          onLogout
        )
      ).rejects.toEqual({ status: 401, message: 'JWT expired' })

      expect(onLogout).toHaveBeenCalledTimes(1)
    })

    it('relanza excepciones que no son de auth', async () => {
      const onLogout = vi.fn()

      await expect(
        conManejoAuth(Promise.reject(new Error('Network error')), onLogout)
      ).rejects.toThrow('Network error')

      expect(onLogout).not.toHaveBeenCalled()
    })
  })
})
