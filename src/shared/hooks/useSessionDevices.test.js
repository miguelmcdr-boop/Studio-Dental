import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useSessionDevices,
  parseDeviceType,
  parseBrowser,
  parseOS,
} from './useSessionDevices'

const mockGetSession = vi.fn()

vi.mock('../../infrastructure/supabase/supabaseClient', () => ({
  USE_SUPABASE: true,
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
    },
  },
}))

describe('useSessionDevices (Blueprint 02 §05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-test-123' },
        },
      },
    })
  })

  it('parsea correctamente tipos de dispositivos y navegadores', () => {
    expect(parseDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile')).toBe('mobile')
    expect(parseDeviceType('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet')
    expect(parseDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('desktop')

    expect(parseBrowser('Mozilla/5.0 Chrome/128.0')).toBe('Chrome')
    expect(parseBrowser('Mozilla/5.0 Safari/605.1')).toBe('Safari')
    expect(parseBrowser('Mozilla/5.0 Firefox/130.0')).toBe('Firefox')

    expect(parseOS('Macintosh')).toBe('Mac')
    expect(parseOS('Windows NT 10.0')).toBe('Windows')
    expect(parseOS('Android')).toBe('Android')
  })

  it('obtiene la sesión activa real desde Supabase Auth', async () => {
    const { result } = renderHook(() => useSessionDevices())

    await waitFor(() => {
      expect(result.current.devices.length).toBeGreaterThan(0)
      expect(result.current.devices[0].id).toBe('user-test-123')
    })

    const currentDevice = result.current.devices[0]
    expect(currentDevice.esActual).toBe(true)
    expect(currentDevice.ultimaActividad).toBe('Ahora mismo')
  })
})
