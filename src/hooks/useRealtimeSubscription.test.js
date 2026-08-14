/**
 * Tests unitarios del hook useRealtimeSubscription (F5-01).
 *
 * Cobertura:
 * - Monta → se suscribe
 * - Desmonta → se desuscribe (sin memory leak)
 * - enabled=false → no se suscribe
 * - Cambio de tabla → re-suscripción limpia
 * - Filtros personalizados
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import * as realtimeService from '../services/realtimeService'

// Espía del método suscribirseATabla
vi.mock('../services/realtimeService', async () => {
  const actual = await vi.importActual('../services/realtimeService')
  return {
    ...actual,
    suscribirseATabla: vi.fn()
  }
})

describe('useRealtimeSubscription', () => {
  let mockUnsubscribe
  let mockSubscription

  beforeEach(() => {
    vi.clearAllMocks()

    mockUnsubscribe = vi.fn()
    mockSubscription = { unsubscribe: mockUnsubscribe }

    vi.mocked(realtimeService.suscribirseATabla).mockReturnValue(mockSubscription)
  })

  it('debe suscribirse a la tabla al montar', () => {
    const callback = vi.fn()

    renderHook(() =>
      useRealtimeSubscription('citas', callback)
    )

    expect(realtimeService.suscribirseATabla).toHaveBeenCalledWith(
      'citas',
      expect.any(Function),
      expect.objectContaining({ evento: '*' })
    )
  })

  it('debe desuscribirse al desmontar (sin memory leak)', () => {
    const callback = vi.fn()

    const { unmount } = renderHook(() =>
      useRealtimeSubscription('citas', callback)
    )

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('no debe suscribirse si enabled es false', () => {
    const callback = vi.fn()

    renderHook(() =>
      useRealtimeSubscription('citas', callback, { enabled: false })
    )

    expect(realtimeService.suscribirseATabla).not.toHaveBeenCalled()
  })

  it('debe pasar opciones de evento al servicio', () => {
    const callback = vi.fn()

    renderHook(() =>
      useRealtimeSubscription('citas', callback, { evento: 'INSERT' })
    )

    expect(realtimeService.suscribirseATabla).toHaveBeenCalledWith(
      'citas',
      expect.any(Function),
      expect.objectContaining({ evento: 'INSERT' })
    )
  })

  it('debe pasar filtro al servicio', () => {
    const callback = vi.fn()
    const pacienteId = '550e8400-e29b-41d4-a716-446655440000'

    renderHook(() =>
      useRealtimeSubscription('citas', callback, {
        filtro: { columna: 'paciente_id', valor: pacienteId }
      })
    )

    expect(realtimeService.suscribirseATabla).toHaveBeenCalledWith(
      'citas',
      expect.any(Function),
      expect.objectContaining({
        filtro: { columna: 'paciente_id', valor: pacienteId }
      })
    )
  })

  it('debe re-suscribirse si cambia la tabla', () => {
    const callback = vi.fn()

    const { rerender } = renderHook(
      ({ tabla }) => useRealtimeSubscription(tabla, callback),
      { initialProps: { tabla: 'citas' } }
    )

    expect(realtimeService.suscribirseATabla).toHaveBeenCalledTimes(1)

    rerender({ tabla: 'pacientes' })

    // 2 suscripciones (una por cada tabla)
    expect(realtimeService.suscribirseATabla).toHaveBeenCalledTimes(2)
    // 1 desuscripción (al cambiar de citas a pacientes)
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('debe re-suscribirse si cambia el evento', () => {
    const callback = vi.fn()

    const { rerender } = renderHook(
      ({ evento }) => useRealtimeSubscription('citas', callback, { evento }),
      { initialProps: { evento: '*' } }
    )

    expect(realtimeService.suscribirseATabla).toHaveBeenCalledTimes(1)

    rerender({ evento: 'INSERT' })

    expect(realtimeService.suscribirseATabla).toHaveBeenCalledTimes(2)
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('no debe fallar si el servicio retorna null (Supabase no configurado)', () => {
    vi.mocked(realtimeService.suscribirseATabla).mockReturnValue(null)

    const callback = vi.fn()

    expect(() => {
      const { unmount } = renderHook(() =>
        useRealtimeSubscription('citas', callback)
      )
      unmount()
    }).not.toThrow()
  })

  it('no debe suscribirse si tabla es vacía', () => {
    const callback = vi.fn()

    renderHook(() =>
      useRealtimeSubscription('', callback)
    )

    expect(realtimeService.suscribirseATabla).not.toHaveBeenCalled()
  })

  it('debe actualizar el callback sin re-suscribirse', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const { rerender } = renderHook(
      ({ callback }) => useRealtimeSubscription('citas', callback),
      { initialProps: { callback: callback1 } }
    )

    expect(realtimeService.suscribirseATabla).toHaveBeenCalledTimes(1)

    // Cambiar el callback
    rerender({ callback: callback2 })

    // NO debe haber re-suscripción (mismo número de llamadas)
    expect(realtimeService.suscribirseATabla).toHaveBeenCalledTimes(1)
  })

  it('debe invocar el callback actualizado al recibir evento', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const { rerender } = renderHook(
      ({ callback }) => useRealtimeSubscription('citas', callback),
      { initialProps: { callback: callback1 } }
    )

    // Capturar el callback registrado
    const registeredCallback = vi.mocked(realtimeService.suscribirseATabla).mock.calls[0][1]

    rerender({ callback: callback2 })

    // Invocar el callback registrado (que debe invocar el más reciente)
    const payload = { eventType: 'INSERT', new: { id: '1' } }
    registeredCallback(payload)

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledWith(payload)
  })
})
