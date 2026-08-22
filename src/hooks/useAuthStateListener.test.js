import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuthStateListener } from './useAuthStateListener'

// Mocks
const mockUnsubscribe = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockCallbackRef = { current: null }

vi.mock('../services/supabaseClient', () => ({
  USE_SUPABASE: true,
  supabase: {
    auth: {
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args)
    }
  }
}))

describe('useAuthStateListener (F6-H)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockImplementation((cb) => {
      mockCallbackRef.current = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
  })

  afterEach(() => {
    mockCallbackRef.current = null
  })

  it('no registra listener si activo=false', () => {
    const onLogout = vi.fn()
    renderHook(() => useAuthStateListener({ activo: false, onLogout }))
    expect(mockOnAuthStateChange).not.toHaveBeenCalled()
  })

  it('registra listener de auth al activarse', () => {
    const onLogout = vi.fn()
    renderHook(() => useAuthStateListener({ activo: true, onLogout }))
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
  })

  it('dispara onLogout al recibir evento SIGNED_OUT', async () => {
    const onLogout = vi.fn()
    renderHook(() => useAuthStateListener({ activo: true, onLogout }))

    await mockCallbackRef.current('SIGNED_OUT', null)
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('dispara onLogout al recibir evento USER_DELETED', async () => {
    const onLogout = vi.fn()
    renderHook(() => useAuthStateListener({ activo: true, onLogout }))

    await mockCallbackRef.current('USER_DELETED', null)
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('dispara onLogout si TOKEN_REFRESHED llega sin sesión', async () => {
    const onLogout = vi.fn()
    renderHook(() => useAuthStateListener({ activo: true, onLogout }))

    await mockCallbackRef.current('TOKEN_REFRESHED', null)
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('NO dispara onLogout si SIGNED_IN (manejo normal)', async () => {
    const onLogout = vi.fn()
    renderHook(() => useAuthStateListener({ activo: true, onLogout }))

    await mockCallbackRef.current('SIGNED_IN', { user: { id: 'u1' } })
    expect(onLogout).not.toHaveBeenCalled()
  })

  it('NO dispara onLogout si TOKEN_REFRESHED con sesión válida', async () => {
    const onLogout = vi.fn()
    renderHook(() => useAuthStateListener({ activo: true, onLogout }))

    await mockCallbackRef.current('TOKEN_REFRESHED', { user: { id: 'u1' } })
    expect(onLogout).not.toHaveBeenCalled()
  })

  it('usa el callback más reciente (ref actualizado)', async () => {
    const onLogout1 = vi.fn()
    const onLogout2 = vi.fn()

    const { rerender } = renderHook(
      ({ onLogout }) => useAuthStateListener({ activo: true, onLogout }),
      { initialProps: { onLogout: onLogout1 } }
    )

    rerender({ onLogout: onLogout2 })

    await mockCallbackRef.current('SIGNED_OUT', null)
    expect(onLogout1).not.toHaveBeenCalled()
    expect(onLogout2).toHaveBeenCalledTimes(1)
  })

  it('hace unsubscribe al desmontar', () => {
    const onLogout = vi.fn()
    const { unmount } = renderHook(() => useAuthStateListener({ activo: true, onLogout }))

    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
