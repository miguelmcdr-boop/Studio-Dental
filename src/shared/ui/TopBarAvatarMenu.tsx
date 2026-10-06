/**
 * TopBarAvatarMenu — Dropdown de Avatar con 6 secciones exactas del Blueprint 03
 * Perfil, Preferencias, Atajos, Modo Foco, Dispositivos, Cerrar sesión
 */
import React, { useState, useRef, useEffect } from 'react'
import {
  User,
  Settings,
  Keyboard,
  Maximize2,
  Smartphone,
  LogOut,
} from 'lucide-react'
import { Badge } from './ui/Badge'
import { useSidebarStore } from '../../app/stores/useSidebarStore'
import { NOMBRES_ROLES } from '../../constants/rbacConstants'
import type { TopBarUserProfile } from './TopBar'

export interface TopBarAvatarMenuProps {
  userProfile?: TopBarUserProfile | null
  onLogout?: () => void
  onOpenAtajos?: () => void
  onOpenPerfil?: () => void
  onOpenPreferencias?: () => void
  onOpenDispositivos?: () => void
}

export const TopBarAvatarMenu: React.FC<TopBarAvatarMenuProps> = ({
  userProfile,
  onLogout,
  onOpenAtajos,
  onOpenPerfil,
  onOpenPreferencias,
  onOpenDispositivos,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const toggleFocusMode = useSidebarStore((s) => s.toggleFocusMode)

  const inicial = userProfile?.nombreCompleto
    ? userProfile.nombreCompleto.replace('Dr. ', '').replace('Dra. ', '').charAt(0).toUpperCase()
    : 'U'

  const nombreRol =
    userProfile?.rol && userProfile.rol in NOMBRES_ROLES
      ? (NOMBRES_ROLES as Record<string, string>)[userProfile.rol]
      : 'Usuario'

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const SECCIONES = [
    {
      id: 'perfil',
      label: 'Perfil',
      icon: User,
      onClick: () => {
        setIsOpen(false)
        onOpenPerfil?.()
      },
    },
    {
      id: 'preferencias',
      label: 'Preferencias',
      icon: Settings,
      onClick: () => {
        setIsOpen(false)
        onOpenPreferencias?.()
      },
    },
    {
      id: 'atajos',
      label: 'Panel de Atajos',
      icon: Keyboard,
      shortcut: '?',
      onClick: () => {
        setIsOpen(false)
        onOpenAtajos?.()
      },
    },
    {
      id: 'foco',
      label: 'Modo Foco',
      icon: Maximize2,
      shortcut: '⌘⇧F',
      onClick: () => {
        setIsOpen(false)
        toggleFocusMode()
      },
    },
    {
      id: 'dispositivos',
      label: 'Dispositivos',
      icon: Smartphone,
      onClick: () => {
        setIsOpen(false)
        onOpenDispositivos?.()
      },
    },
    {
      id: 'logout',
      label: 'Cerrar sesión',
      icon: LogOut,
      danger: true,
      onClick: () => {
        setIsOpen(false)
        onLogout?.()
      },
    },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-0.5 rounded-full hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer shrink-0"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menú de usuario"
        title={userProfile?.nombreCompleto || 'Mi sesión'}
      >
        {/* Círculo 32px con iniciales + borde gradiente dorado */}
        <div
          className="w-8 h-8 rounded-full p-[1.5px] flex items-center justify-center shadow-xs"
          style={{ background: 'linear-gradient(135deg, #E5C378 0%, #B88E3A 100%)' }}
        >
          <div className="w-full h-full bg-white dark:bg-graphite-900 text-primary font-bold rounded-full flex items-center justify-center text-xs">
            {inicial}
          </div>
        </div>
        {/* Accesibilidad y contrato de testing */}
        <span className="sr-only">{userProfile?.nombreCompleto || 'Mi sesión'}</span>
        <span className="sr-only">{nombreRol}</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-surface border border-surface rounded-xl shadow-2xl overflow-hidden z-50 py-1"
        >
          {/* Header Identidad */}
          <div className="px-4 py-3 border-b border-surface">
            {Boolean(userProfile?.clinicaNombre) && (
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 truncate">
                {String(userProfile?.clinicaNombre)}
              </p>
            )}
            <p className="text-xs font-bold text-graphite-900 dark:text-graphite-100 truncate">
              {userProfile?.nombreCompleto || 'Mi sesión'}
            </p>
            <p className="text-[11px] text-graphite-500 truncate">{userProfile?.email}</p>
            <div className="mt-1">
              <Badge size="sm" variant="neutral">{nombreRol}</Badge>
            </div>
          </div>

          {/* 6 Secciones del Blueprint 03 */}
          <div className="py-1">
            {SECCIONES.map((sec) => (
              <button
                key={sec.id}
                role="menuitem"
                type="button"
                onClick={sec.onClick}
                className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${
                  sec.danger
                    ? 'text-clinical-error hover:bg-clinical-error/10'
                    : 'text-graphite-700 dark:text-graphite-200 hover:bg-graphite-100 dark:hover:bg-graphite-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <sec.icon size={14} className={sec.danger ? 'text-clinical-error' : 'text-graphite-500'} />
                  <span className="truncate">{sec.label}</span>
                </div>
                {sec.shortcut && (
                  <kbd className="px-1 py-0.5 text-[9px] font-mono bg-graphite-100 dark:bg-graphite-800 rounded border border-surface text-graphite-400">
                    {sec.shortcut}
                  </kbd>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
