import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SidebarMode = 'expanded' | 'collapsed' | 'hidden'
export type Theme = 'light' | 'surgical' | 'dark'

export interface SidebarState {
  mode: SidebarMode
  theme: Theme
  activeModule: string
  focusMode: boolean

  setMode: (mode: SidebarMode) => void
  toggleMode: () => void
  setTheme: (theme: Theme) => void
  setActiveModule: (module: string) => void
  setFocusMode: (focus: boolean) => void
  toggleFocusMode: () => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      mode: 'expanded',
      theme: 'light',
      activeModule: 'Dashboard',
      focusMode: false,

      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === 'expanded' ? 'collapsed' : 'expanded' }),
      setTheme: (theme) => set({ theme }),
      setActiveModule: (module) => set({ activeModule: module }),
      setFocusMode: (focus) => set({ focusMode: focus }),
      toggleFocusMode: () => set({ focusMode: !get().focusMode }),
    }),
    { name: 'sd_sidebar_state' }
  )
)
