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

const themeStorage = {
  getItem: (k: string) => {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(k) || (localStorage.getItem('darkMode') === 'true' ? 'dark' : null)
    if (!raw) return null
    if (THEMES.includes(raw as Theme)) return { state: { theme: raw as Theme } }
    try { return (JSON.parse(raw)?.state?.theme ? JSON.parse(raw) : null) } catch { return null }
  },
  setItem: (k: string, v: { state: { theme: Theme } }) => { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v.state.theme) },
  removeItem: (k: string) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(k) },
}

export interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
  cycleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: (themeStorage.getItem('dentikos_theme')?.state?.theme as Theme) || 'light',
      setTheme: (t) => { if (THEMES.includes(t)) { aplicarClasesDocumento(t); set({ theme: t }) } },
      cycleTheme: () => {
        const next = THEMES[(THEMES.indexOf(get().theme) + 1) % THEMES.length]
        aplicarClasesDocumento(next); set({ theme: next })
      },
    }),
    { name: 'dentikos_theme', storage: themeStorage, onRehydrateStorage: () => (s) => { if (s?.theme) aplicarClasesDocumento(s.theme) } }
  )
)
if (typeof document !== 'undefined') aplicarClasesDocumento(useThemeStore.getState().theme)
