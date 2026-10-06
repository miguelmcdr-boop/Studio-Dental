import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { playSound } from '../../shared/utils/soundEffects'

export type ModuleAccent = 'gold' | 'blue' | 'teal' | 'red' | 'amber'

export interface BreadcrumbItem {
  label: string
  slug?: string
  onClick?: () => void
}

export interface TopBarState {
  activeModule: string
  breadcrumbs: BreadcrumbItem[]
  isDirty: boolean
  savedAt: number | null
  searchOpen: boolean
  notificationsOpen: boolean
  avatarOpen: boolean
  focusMode: boolean
  presentationMode: boolean
  timerStart: number | null
  contextualMessage: string

  setActiveModule: (module: string) => void
  setBreadcrumbs: (items: BreadcrumbItem[]) => void
  setIsDirty: (dirty: boolean) => void
  markSaved: () => void
  toggleSearch: () => void
  toggleNotifications: () => void
  toggleAvatar: () => void
  setFocusMode: (focus: boolean) => void
  setPresentationMode: (presentation: boolean) => void
  startTimer: () => void
  stopTimer: () => void
  setContextualMessage: (msg: string) => void
}

export const useTopBarStore = create<TopBarState>()(
  persist(
    (set) => ({
      activeModule: 'Dashboard',
      breadcrumbs: [],
      isDirty: false,
      savedAt: null,
      searchOpen: false,
      notificationsOpen: false,
      avatarOpen: false,
      focusMode: false,
      presentationMode: false,
      timerStart: null,
      contextualMessage: '',

      setActiveModule: (module) => set({ activeModule: module }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      setIsDirty: (isDirty) => set({ isDirty }),
      markSaved: () => {
        set({ isDirty: false, savedAt: Date.now() })
        try { playSound('save') } catch {}
      },
      toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
      toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
      toggleAvatar: () => set((s) => ({ avatarOpen: !s.avatarOpen })),
      setFocusMode: (focusMode) => set({ focusMode }),
      setPresentationMode: (presentationMode) => set({ presentationMode }),
      startTimer: () => set({ timerStart: Date.now() }),
      stopTimer: () => set({ timerStart: null }),
      setContextualMessage: (msg) => set({ contextualMessage: msg }),
    }),
    { name: 'sd_topbar_state', partialize: (s) => ({ focusMode: s.focusMode }) }
  )
)
