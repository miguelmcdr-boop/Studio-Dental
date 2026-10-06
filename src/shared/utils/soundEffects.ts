type SoundType = 'openPalette' | 'selectResult' | 'criticalNotif' | 'infoNotif' | 'breadcrumbClick' | 'save'

const CFG: Record<SoundType, { f: number | number[]; d: number; v: number }> = {
  openPalette: { f: 1200, d: 0.015, v: 0.05 },
  selectResult: { f: [680, 850], d: 0.08, v: 0.08 },
  criticalNotif: { f: 220, d: 0.18, v: 0.1 },
  infoNotif: { f: 850, d: 0.03, v: 0.04 },
  breadcrumbClick: { f: 1200, d: 0.015, v: 0.03 },
  save: { f: [680, 850], d: 0.08, v: 0.08 },
}

export const playSound = (type: SoundType): void => {
  if (typeof window === 'undefined') return
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const s = CFG[type]
    const g = ctx.createGain()
    g.connect(ctx.destination)
    g.gain.setValueAtTime(s.v, ctx.currentTime)
    if (Array.isArray(s.f)) {
      s.f.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.frequency.value = freq
        osc.connect(g)
        osc.start(ctx.currentTime + i * 0.04)
        osc.stop(ctx.currentTime + i * 0.04 + s.d)
      })
    } else {
      const osc = ctx.createOscillator()
      osc.frequency.value = s.f
      osc.connect(g)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.d)
      osc.start()
      osc.stop(ctx.currentTime + s.d)
    }
  } catch {
    // Audio deshabilitado silenciosamente
  }
}
