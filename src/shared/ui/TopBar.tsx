/**
 * TopBar — Blueprint 03: 3 Zonas (Contexto 40%, Búsqueda 30%, Identidad/Acciones 30%)
 * Altura 56px desktop / 52px tablet / 48px mobile. Acento contextual por módulo.
 */
import React, { useState, useMemo } from 'react'
import { Search, Bell } from 'lucide-react'
import { ClinicaSelector } from './ClinicaSelector'
import { SelectorSede } from './SelectorSede'
import { NotificationCenter } from './NotificationCenter'
import { TopBarBreadcrumbs } from './TopBarBreadcrumbs'
import { TopBarActions, type AccionContextualItem } from './TopBarActions'
import { TopBarAvatarMenu } from './TopBarAvatarMenu'
import { useNotifications } from '../hooks/useNotifications'
import { useSidebarStore } from '../../app/stores/useSidebarStore'
import { useTopBarStore, type BreadcrumbItem } from '../../app/stores/useTopBarStore'
import type { Paciente } from '../../domains/clinical/patient/schemas/pacienteSchema'

export type AppTheme = 'light' | 'dark' | 'surgical'

const ACENTOS_MODULO: Record<string, string> = {
  Dashboard: '#B88E3A',
  Pacientes: '#B88E3A',
  Pagos: '#B88E3A',
  Agenda: '#0284C7',
  Esterilización: '#0D9488',
  'Urgencias GES': '#DC2626',
  'Urgencias y GES': '#DC2626',
  Inventario: '#D97706',
  Vademécum: '#0D9488',
}

export interface TopBarUserProfile {
  nombreCompleto?: string
  email?: string
  rol?: string
  [key: string]: unknown
}

export interface TopBarProps {
  userProfile?: TopBarUserProfile | null
  activeSection?: string
  pacienteSeleccionado?: Paciente | null
  breadcrumbs?: BreadcrumbItem[]
  accionPrimaria?: AccionContextualItem | null
  accionesSecundarias?: AccionContextualItem[]
  onLogout?: () => void
  darkMode?: boolean
  theme?: AppTheme | string
  onToggleDarkMode?: () => void
  onCycleTheme?: () => void
  onCambioClinica?: (nuevaClinicaId: string) => void
  onOpenSearch?: () => void
  onOpenAtajos?: () => void
  onOpenPerfil?: () => void
  onOpenPreferencias?: () => void
  onOpenDispositivos?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  userProfile,
  activeSection = 'Dashboard',
  pacienteSeleccionado,
  breadcrumbs = [{ label: 'Dashboard' }],
  accionPrimaria,
  accionesSecundarias = [],
  onLogout,
  theme,
  onCambioClinica,
  onOpenSearch,
  onOpenAtajos,
  onOpenPerfil,
  onOpenPreferencias,
  onOpenDispositivos,
}) => {
  const [notifOpen, setNotifOpen] = useState(false)
  const notificaciones = useNotifications()
  const focusMode = useSidebarStore((s) => s.focusMode)
  const presentationMode = useTopBarStore((s) => s.presentationMode)

  const isSurgical = theme === 'surgical'
  const acentoColor = ACENTOS_MODULO[activeSection] || '#B88E3A'

  // Mensaje contextual inteligente según hora y módulo
  const mensajeContextual = useMemo(() => {
    if (pacienteSeleccionado) return `${pacienteSeleccionado.nombre} — Ficha activa`
    const hour = new Date().getHours()
    if (activeSection === 'Agenda') {
      if (hour >= 8 && hour < 12) return 'Agenda — Citas de la mañana'
      if (hour >= 12 && hour < 18) return 'Agenda — Jornada de la tarde'
      return 'Agenda — Cierre de jornada'
    }
    return ''
  }, [activeSection, pacienteSeleccionado])

  if (isSurgical || focusMode || presentationMode) return null

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-surface surgical:bg-surface border-b border-surface shadow-2xs transition-all flex flex-col">
        {/* Acento por módulo activo (borde superior de 2px) */}
        <div className="h-[2px] w-full shrink-0 transition-colors" style={{ backgroundColor: acentoColor }} />

        <div className="flex items-center justify-between px-4 h-14 md:h-[56px] gap-3">
          {/* Zona Izquierda 40%: Breadcrumbs, Timer e isDirty */}
          <div className="flex items-center gap-3 w-[40%] min-w-0">
            <TopBarBreadcrumbs
              items={breadcrumbs}
              pacienteId={pacienteSeleccionado?.id ? String(pacienteSeleccionado.id) : null}
            />
          </div>

          {/* Zona Centro 30%: Búsqueda ⌘K + Contextual Intelligence */}
          <div className="flex items-center justify-center gap-2 w-[30%]">
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center justify-between w-full max-w-[240px] px-2.5 py-1.5 text-xs text-graphite-500 dark:text-graphite-400 bg-graphite-100/80 dark:bg-graphite-800/80 hover:bg-graphite-200 dark:hover:bg-graphite-700/80 rounded-lg border border-surface transition-colors cursor-pointer"
              title="Buscar (⌘K)"
              aria-label="Buscar pacientes y módulos"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Search size={13} className="text-primary shrink-0" />
                <span className="truncate">{mensajeContextual || 'Buscar...'}</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white dark:bg-graphite-900 rounded border border-surface shadow-2xs shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Zona Derecha 30%: Acciones contextuales, Sede, Notificaciones y Avatar */}
          <div className="flex items-center justify-end gap-2 w-[30%] shrink-0">
            {/* Acciones contextuales (primaria dorada + menú ⋯) */}
            <TopBarActions
              primaria={accionPrimaria}
              secundarias={accionesSecundarias}
              className="hidden sm:flex"
            />

            {/* Selector de Sede */}
            <div className="hidden md:flex items-center gap-1.5 pl-1.5 border-l border-surface">
              <ClinicaSelector onCambioClinica={onCambioClinica} />
              <SelectorSede compacto />
            </div>

            {/* Centro de Notificaciones */}
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label="Centro de notificaciones"
              className="relative p-1.5 rounded-lg text-graphite-600 dark:text-graphite-300 hover:bg-graphite-100 dark:hover:bg-graphite-800 transition-colors cursor-pointer"
            >
              <Bell size={17} />
              {notificaciones.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-black font-extrabold text-[8px] flex items-center justify-center">
                  {notificaciones.length > 9 ? '9+' : notificaciones.length}
                </span>
              )}
            </button>

            {/* Avatar con Dropdown de 6 Secciones */}
            <TopBarAvatarMenu
              userProfile={userProfile}
              onLogout={onLogout}
              onOpenAtajos={onOpenAtajos}
              onOpenPerfil={onOpenPerfil}
              onOpenPreferencias={onOpenPreferencias}
              onOpenDispositivos={onOpenDispositivos}
            />
          </div>
        </div>
      </header>

      {/* Drawer de Notificaciones */}
      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  )
}

TopBar.displayName = 'TopBar'
