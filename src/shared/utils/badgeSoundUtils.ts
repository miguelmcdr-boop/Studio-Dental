/**
 * Utilidad de feedback sonoro para alertas críticas en badges (Blueprint 02 §05)
 * Tono grave: 220Hz (180ms)
 */
export const playCriticoSound = (): void => {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.setValueAtTime(220, now)
    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.18)
  } catch {
    // Silenciado o no soportado
  }
}
