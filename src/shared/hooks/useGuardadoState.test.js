import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGuardadoState } from './useGuardadoState'
import { useTopBarStore } from '../../app/stores/useTopBarStore'

describe('useGuardadoState (BP03 §08 Feature 3)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useTopBarStore.setState({ isDirty: false, savedAt: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna "neutral" inicialmente sin cambios ni guardado reciente', () => {
    const { result } = renderHook(() => useGuardadoState())
    expect(result.current).toBe('neutral')
  })

  it('retorna "dirty" cuando isDirty es true', () => {
    const { result } = renderHook(() => useGuardadoState())

    act(() => {
      useTopBarStore.getState().setIsDirty(true)
    })

    expect(result.current).toBe('dirty')
  })

  it('retorna "saved" al invocar markSaved() y regresa a "neutral" tras 2.5s', () => {
    const { result } = renderHook(() => useGuardadoState())

    act(() => {
      useTopBarStore.getState().setIsDirty(true)
    })
    expect(result.current).toBe('dirty')

    act(() => {
      useTopBarStore.getState().markSaved()
    })
    expect(result.current).toBe('saved')

    // Tras 2.5s desaparece el indicador y vuelve a neutral
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(result.current).toBe('neutral')
  })
})
