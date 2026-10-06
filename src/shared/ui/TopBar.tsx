/**
 * TopBar — Blueprint 02: Breadcrumbs, Acciones contextuales, Búsqueda ⌘K, Selector de Sede y Notificaciones
 * Oculto automáticamente en Modo Quirúrgico y Modo Foco.
 */
import React, { useState, useRef, useEffect } from 'react'
import { LogOut, Search, Bell, ChevronRight, type LucideIcon } from 'lucide-react'
import { Icon } from './Icon'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { ClinicaSelector } from './ClinicaSelector'
import { SelectorSede } from './SelectorSede'
import { NotificationCenter } from './NotificationCenter'
import { useNotifications } from '../hooks/useNotifications'
import { useSidebarStore } from '../../app/stores/useSidebarStore'
import { NOMBRES_ROLES } from '../../constants/rbacConstants'

export type AppTheme = 'light' | 'dark' | 'surgical'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export interface ContextualAction {
  label: string
  icon: LucideIcon
  onClick: () => void
}

export interface TopBarUserProfile {
  nombreCompleto?: string
  email?: string
  rol?: string
  [key: string]: unknown
}

export interface TopBarProps {
  userProfile?: TopBarUserProfile | null
  onLogout?: () => void
  darkMode?: boolean
  theme?: AppTheme | string
  onToggleDarkMode?: () => void
  onCycleTheme?: () => void
  onCambioClinica?: (nuevaClinicaId: string) => void
  breadcrumbs?: BreadcrumbItem[]
  contextualActions?: ContextualAction[]
  onOpenSearch?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  userProfile,
  onLogout,
  theme,
  onCambioClinica,
  breadcrumbs = [{ label: 'Dashboard' }],
  contextualActions = [],
  onOpenSearch,
}) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [notifOpen, setNotifOpen] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const notificaciones = useNotifications()
  const focusMode = useSidebarStore((s) => s.focusMode)
  const isSurgical = theme === 'surgical'

  const inicial = userProfile?.nombreCompleto
    ? userProfile.nombreCompleto.replace('Dr. ', '').replace('Dra. ', '').charAt(0).toUpperCase()
    : 'U'

  const nombreRol =
    userProfile?.rol && userProfile.rol in NOMBRES_ROLES
      ? (NOMBRES_ROLES as Record<string, string>)[userProfile.rol]
      : 'Usuario'

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [menuOpen])

  // TopBar se oculta completamente en Modo Quirúrgico o Modo Foco
  if (isSurgical || focusMode) return null

  const handleLogout = (): void => {
    setMenuOpen(false)
    onLogout?.()
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-surface surgical:bg-surface border-b border-surface shadow-xs transition-all">
        <div className="flex items-center justify-between px-4 py-2 h-16 gap-3">
          {/* Izquierda: Breadcrumbs y acciones contextuales */}
          <div className="flex items-center gap-3 min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-graphite-500 dark:text-graphite-400">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1
                return (
                  <React.Fragment key={`${crumb.label}-${idx}`}>
                    {idx > 0 && <ChevronRight size={13} className="text-graphite-400 shrink-0" />}
                    {isLast ? (
                      <span className="font-bold text-graphite-900 dark:text-graphite-100 truncate max-w-[180px]">
                        {crumb.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={crumb.onClick}
                        className="hover:text-primary transition-colors truncate max-w-[140px]"
                      >
                        {crumb.label}
                      </button>
                    )}
                  </React.Fragment>
                )
              })}
            </nav>

            {contextualActions.length > 0 && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-surface">
                {contextualActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="ghost"
                    size="sm"
                    onClick={action.onClick}
                    className="text-xs h-8 px-2.5 gap-1.5"
                  >
                    <Icon icon={action.icon} size="sm" />
                    <span>{action.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Derecha: Buscar ⌘K, Selector Sede, Notificaciones y Avatar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Botón Buscar ⌘K */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-graphite-500 dark:text-graphite-400 bg-graphite-100 dark:bg-graphite-800/80 hover:bg-graphite-200 dark:hover:bg-graphite-700/80 rounded-lg border border-surface transition-colors"
              title="Buscar (⌘K)"
              aria-label="Buscar pacientes y módulos"
            >
              <Search size={14} className="text-primary shrink-0" />
              <span className="hidden sm:inline">Buscar</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-graphite-900 rounded border border-surface">
                ⌘K
              </kbd>
            </button>

            {/* Selector de Clínica y Sede */}
            <div className="hidden md:flex items-center gap-1.5">
              <ClinicaSelector onCambioClinica={onCambioClinica} />
              <SelectorSede compacto />
            </div>

            {/* Centro de Notificaciones */}
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label="Centro de notificaciones"
              className="relative p-2 rounded-lg text-graphite-600 dark:text-graphite-300 hover:bg-graphite-100 dark:hover:bg-graphite-800 transition-colors"
            >
              <Bell size={18} />
              {notificaciones.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-black font-extrabold text-[9px] flex items-center justify-center">
                  {notificaciones.length > 9 ? '9+' : notificaciones.length}
                </span>
              )}
            </button>

            {/* Avatar + Menú de usuario */}
            <div className="relative" ref={menuRef}>
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-graphite-100 dark:hover:bg-graphite-800 transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Menú de usuario"
              >
                <div className="w-8 h-8 bg-graphite-200 dark:bg-graphite-800 text-primary font-bold rounded-full flex items-center justify-center text-xs">
                  {inicial}
                </div>
                <div className="hidden lg:block text-left max-w-[130px]">
                  <p className="text-xs font-semibold text-graphite-900 dark:text-graphite-50 truncate" title={userProfile?.nombreCompleto}>
                    {userProfile?.nombreCompleto || 'Mi sesión'}
                  </p>
                  <p className="text-[10px] text-graphite-500 dark:text-graphite-400 truncate">
                    {nombreRol}
                  </p>
                </div>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 bg-surface border border-surface rounded-xl shadow-lg overflow-hidden z-50 py-1"
                >
                  <div className="px-4 py-3 border-b border-surface">
                    <p className="text-xs font-bold text-graphite-900 dark:text-graphite-100 truncate">
                      {userProfile?.nombreCompleto || 'Mi sesión'}
                    </p>
                    <p className="text-[11px] text-graphite-500 truncate">{userProfile?.email}</p>
                    <Badge size="sm" variant="neutral" className="mt-1">{nombreRol}</Badge>
                  </div>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-clinical-error hover:bg-clinical-error/10 transition-colors"
                  >
                    <Icon icon={LogOut} size="sm" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Drawer de Notificaciones */}
      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  )
}

TopBar.displayName = 'TopBar'
