import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'surgical'
const THEMES: readonly Theme[] = ['light', 'dark', 'surgical'] as const

export const aplicarClasesDocumento = (t: Theme): void => {
  if (typeof document === 'undefined') return
  ;[document.documentElement, document.body].filter(Boolean).forEach((el) => {
    el.classList.remove('dark', 'theme-surgical')
    if (t === 'dark') el.classList.add('dark')
    else if (t === 'surgical') el.classList.add('theme-surgical')
  })
}

const getInit = (): Theme => {
  if (typeof localStorage === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem('dentikos_theme')
    if (raw === 'light' || raw === 'dark' || raw === 'surgical') return raw
    const parsed = raw ? (JSON.parse(raw) as { state?: { theme?: Theme } }) : null
    if (parsed?.state?.theme && THEMES.includes(parsed.state.theme)) return parsed.state.theme
    if (localStorage.getItem('darkMode') === 'true') return 'dark'
  } catch {}
  return 'light'
}

const init = getInit()
if (typeof document !== 'undefined') aplicarClasesDocumento(init)

export interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
  cycleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: init,
      setTheme: (t) => { if (THEMES.includes(t)) { aplicarClasesDocumento(t); set({ theme: t }) } },
      cycleTheme: () => {
        const next = THEMES[(THEMES.indexOf(get().theme) + 1) % THEMES.length]
        aplicarClasesDocumento(next)
        set({ theme: next })
      },
    }),
    { name: 'dentikos_theme', onRehydrateStorage: () => (s) => { if (s?.theme) aplicarClasesDocumento(s.theme) } }
  )
)
