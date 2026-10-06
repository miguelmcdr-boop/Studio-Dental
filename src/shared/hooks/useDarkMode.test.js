import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from './useDarkMode'
import { useThemeStore } from '../../app/stores/useThemeStore'

describe('useDarkMode con soporte de Modo Quirúrgico y Store Compartido', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ theme: 'light' })
    document.documentElement.className = ''
  })

  it('inicia en modo light por defecto cuando no hay persistencia', () => {
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.theme).toBe('light')
    expect(result.current.darkMode).toBe(false)
    expect(result.current.isSurgical).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('theme-surgical')).toBe(false)
  })

  it('permite alternar a modo oscuro con toggleDarkMode', () => {
    const { result } = renderHook(() => useDarkMode())
    act(() => {
      result.current.toggleDarkMode()
    })
    expect(result.current.theme).toBe('dark')
    expect(result.current.darkMode).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('permite activar explícitamente el modo quirúrgico (theme-surgical)', () => {
    const { result } = renderHook(() => useDarkMode())
    act(() => {
      result.current.setTheme('surgical')
    })
    expect(result.current.theme).toBe('surgical')
    expect(result.current.isSurgical).toBe(true)
    expect(result.current.darkMode).toBe(false)
    expect(document.documentElement.classList.contains('theme-surgical')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('permite ciclar entre light -> dark -> surgical -> light', () => {
    const { result } = renderHook(() => useDarkMode())

    // light -> dark
    act(() => {
      result.current.cycleTheme()
    })
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // dark -> surgical
    act(() => {
      result.current.cycleTheme()
    })
    expect(result.current.theme).toBe('surgical')
    expect(document.documentElement.classList.contains('theme-surgical')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // surgical -> light
    act(() => {
      result.current.cycleTheme()
    })
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('theme-surgical')).toBe(false)
  })

  it('sincroniza el estado del tema reactivamente entre diferentes instancias', () => {
    const { result: hookA } = renderHook(() => useDarkMode())
    const { result: hookB } = renderHook(() => useDarkMode())

    expect(hookA.current.theme).toBe('light')
    expect(hookB.current.theme).toBe('light')

    act(() => {
      hookA.current.setTheme('surgical')
    })

    expect(hookA.current.theme).toBe('surgical')
    expect(hookB.current.theme).toBe('surgical')
    expect(hookB.current.isSurgical).toBe(true)
  })
})
