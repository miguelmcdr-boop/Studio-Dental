/**
 * Tests — soundEffects (Blueprint 03)
 * Valida que playSound maneje la API de WebAudio y soporte fallos sin lanzar excepciones.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playSound } from './soundEffects'

describe('soundEffects (Blueprint 03)', () => {
  let mockGain: {
    connect: ReturnType<typeof vi.fn>
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>
    }
  }

  let mockOscillator: {
    frequency: { value: number }
    connect: ReturnType<typeof vi.fn>
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockGain = {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    }

    mockOscillator = {
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }

    // Mock AudioContext
    window.AudioContext = vi.fn().mockImplementation(() => ({
      currentTime: 0,
      destination: {},
      createGain: vi.fn().mockReturnValue(mockGain),
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
    }))
  })

  it('reproduce sonido de frecuencia simple (openPalette)', () => {
    expect(() => playSound('openPalette')).not.toThrow()
    expect(mockOscillator.start).toHaveBeenCalled()
    expect(mockOscillator.stop).toHaveBeenCalled()
  })

  it('reproduce sonido de doble frecuencia (selectResult)', () => {
    expect(() => playSound('selectResult')).not.toThrow()
    expect(mockOscillator.start).toHaveBeenCalled()
  })

  it('no lanza error cuando AudioContext falla o no está disponible', () => {
    // @ts-expect-error simular falta de AudioContext
    window.AudioContext = undefined
    // @ts-expect-error simular falta de webkitAudioContext
    window.webkitAudioContext = undefined

    expect(() => playSound('criticalNotif')).not.toThrow()
  })
})
