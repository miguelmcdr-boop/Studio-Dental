/**
 * Utilidad de feedback sonoro para cambio de tema (Blueprint 02 §04)
 * Pulso doble: 680Hz (40ms) + 850Hz (45ms)
 */
export const playThemeSound = (): void => {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    // Pulso 1: 680Hz (40ms)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.frequency.setValueAtTime(680, now)
    gain1.gain.setValueAtTime(0.03, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.04)

    // Pulso 2: 850Hz (45ms)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.frequency.setValueAtTime(850, now + 0.045)
    gain2.gain.setValueAtTime(0.03, now + 0.045)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.045)
    osc2.stop(now + 0.09)
  } catch {
    // Web Audio silenciado o no soportado
  }
}
