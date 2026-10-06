import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SidebarMode = 'expanded' | 'collapsed' | 'hidden'

export interface SidebarState {
  mode: SidebarMode
  activeModule: string
  focusMode: boolean
  mobileOpen: boolean

  setMode: (mode: SidebarMode) => void
  toggleMode: () => void
  setActiveModule: (module: string) => void
  setFocusMode: (focus: boolean) => void
  toggleFocusMode: () => void
  setMobileOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      mode: 'expanded',
      activeModule: 'Dashboard',
      focusMode: false,
      mobileOpen: false,

      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === 'expanded' ? 'collapsed' : 'expanded' }),
      setActiveModule: (module) => set({ activeModule: module }),
      setFocusMode: (focus) => set({ focusMode: focus }),
      toggleFocusMode: () => set({ focusMode: !get().focusMode }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    {
      name: 'sd_sidebar_state',
      partialize: (state) => ({
        mode: state.mode,
        activeModule: state.activeModule,
        focusMode: state.focusMode,
      }),
    }
  )
)
