import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSessionTimeout } from './useSessionTimeout'

describe('useSessionTimeout (F6-H)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('no dispara timeout si activo=false', () => {
    const onTimeout = vi.fn()
    renderHook(() => useSessionTimeout({ activo: false, timeoutMs: 1000, onTimeout }))

    vi.advanceTimersByTime(5000)
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('dispara onTimeout tras período de inactividad', () => {
    const onTimeout = vi.fn()
    renderHook(() => useSessionTimeout({ activo: true, timeoutMs: 1000, warnMs: 200, onTimeout }))

    vi.advanceTimersByTime(999)
    expect(onTimeout).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('dispara onWarning antes del timeout', () => {
    const onWarning = vi.fn()
    const onTimeout = vi.fn()
    renderHook(() => useSessionTimeout({
      activo: true,
      timeoutMs: 1000,
      warnMs: 200,
      onTimeout,
      onWarning
    }))

    // Advertencia a los 800ms (1000 - 200)
    vi.advanceTimersByTime(800)
    expect(onWarning).toHaveBeenCalledTimes(1)
    expect(onTimeout).not.toHaveBeenCalled()

    // Timeout a los 1000ms
    vi.advanceTimersByTime(200)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('reinicia timers con actividad del usuario (mousemove)', () => {
    const onTimeout = vi.fn()
    renderHook(() => useSessionTimeout({ activo: true, timeoutMs: 1000, warnMs: 200, onTimeout }))

    // Avanzar 500ms y simular actividad
    vi.advanceTimersByTime(500)
    window.dispatchEvent(new Event('mousemove'))

    // Avanzar otros 600ms (total 1100ms desde inicio, pero solo 600 desde actividad)
    vi.advanceTimersByTime(600)
    expect(onTimeout).not.toHaveBeenCalled()

    // Completar el timeout desde la última actividad
    vi.advanceTimersByTime(400)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('reinicia timers con actividad de teclado (keydown)', () => {
    const onTimeout = vi.fn()
    renderHook(() => useSessionTimeout({ activo: true, timeoutMs: 1000, warnMs: 200, onTimeout }))

    vi.advanceTimersByTime(900)
    window.dispatchEvent(new Event('keydown'))

    vi.advanceTimersByTime(900)
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('limpia listeners al desmontar', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const onTimeout = vi.fn()

    const { unmount } = renderHook(() => useSessionTimeout({
      activo: true,
      timeoutMs: 1000,
      onTimeout
    }))

    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalled()
    removeEventListenerSpy.mockRestore()
  })

  it('limpia timers cuando activo cambia a false', () => {
    const onTimeout = vi.fn()
    const { rerender } = renderHook(
      ({ activo }) => useSessionTimeout({ activo, timeoutMs: 1000, onTimeout }),
      { initialProps: { activo: true } }
    )

    vi.advanceTimersByTime(500)
    rerender({ activo: false })

    vi.advanceTimersByTime(2000)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})
