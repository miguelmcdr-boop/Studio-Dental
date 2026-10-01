/**
 * TopBar v2 — App Shell del Design System (F10-B3)
 *
 * F10-B3: identidad consolidada en avatar-menu del TopBar.
 * Botones de logout y dark toggle siempre visibles como accesos rápidos
 * (contratos TopBar.test.jsx preservados) + menú completo al clickear avatar.
 *
 * API (sin cambios vs F7-25):
 *   <TopBar userProfile onLogout darkMode onToggleDarkMode onCambioClinica />
 *
 * Accesibilidad del menú:
 * - role="menu" + role="menuitem" en items
 * - ESC + click fuera cierra
 * - aria-label "Activar modo claro/oscuro" preservado (contrato TopBar.test.jsx:108)
 */
import React, { useState, useRef, useEffect } from 'react'
import { LogOut, Moon, Sun, Sparkles } from 'lucide-react'
import { Icon } from './Icon'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { ClinicaSelector } from './ClinicaSelector'
import { DentikOSLogo } from './brand/DentikOSLogo'
import { NOMBRES_ROLES } from '../constants/rbacConstants'

const THEME_CONFIG = {
  light: {
    nextTheme: 'dark',
    icon: Moon,
    label: 'Activar modo oscuro'
  },
  dark: {
    nextTheme: 'surgical',
    icon: Sparkles,
    label: 'Activar modo quirúrgico'
  },
  surgical: {
    nextTheme: 'light',
    icon: Sun,
    label: 'Activar modo claro'
  }
}

export const TopBar = ({
  userProfile,
  onLogout,
  darkMode = false,
  theme,
  onToggleDarkMode,
  onCycleTheme,
  onCambioClinica,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  const currentTheme = theme || (darkMode ? 'dark' : 'light')
  const themeInfo = THEME_CONFIG[currentTheme] || THEME_CONFIG.light
  const handleToggleTheme = onCycleTheme || onToggleDarkMode

  const inicial = userProfile?.nombreCompleto
    ? userProfile.nombreCompleto.replace('Dr. ', '').replace('Dra. ', '').charAt(0).toUpperCase()
    : 'U'

  const nombreRol = NOMBRES_ROLES[userProfile?.rol] || 'Usuario'

  // Cerrar menú con ESC o click fuera (F6-04 simplificado)
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
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

  const handleLogout = () => {
    setMenuOpen(false)
    onLogout?.()
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border-b border-graphite-200 dark:border-[#24334A] surgical:border-[#475569] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 h-16">
        {/* Izquierda: Logo DentikOS + ClinicaSelector */}
        <div className="flex items-center gap-4">
          <DentikOSLogo
            variant="horizontal"
            size="sm"
            opticalSize="standard"
            dark={darkMode}
          />

          <div className="h-8 w-px bg-graphite-200 dark:bg-graphite-700 hidden md:block" />

          <div className="hidden md:block">
            <ClinicaSelector onCambioClinica={onCambioClinica} />
          </div>
        </div>

        {/* Derecha: Dark mode toggle + Avatar + menú + Logout */}
        <div className="flex items-center gap-3">
          {/* Dark / Theme mode toggle (siempre visible, contrato tests) */}
          {handleToggleTheme && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleTheme}
              aria-label={themeInfo.label}
              title={themeInfo.label}
              className="surgical:min-w-[48px] surgical:min-h-[48px]"
              data-touch-target="critical"
            >
              <Icon icon={themeInfo.icon} size="md" />
            </Button>
          )}

          <div className="h-8 w-px bg-graphite-200 dark:bg-graphite-700" />

          {/* Avatar + menú */}
          <div className="relative" ref={menuRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-graphite-100 dark:hover:bg-graphite-800 transition-colors surgical:min-w-[48px] surgical:min-h-[48px]"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menú de usuario"
              data-touch-target="critical"
            >
              <div className="w-9 h-9 bg-graphite-300 dark:bg-graphite-700 rounded-full flex items-center justify-center font-semibold text-graphite-700 dark:text-graphite-200 text-sm">
                {inicial}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-graphite-900 dark:text-graphite-50 truncate max-w-[200px]" title={userProfile?.nombreCompleto}>
                  {userProfile?.nombreCompleto || 'Mi sesión'}
                </p>
                <p className="text-xs text-graphite-500 dark:text-graphite-400 truncate" title={`Rol: ${nombreRol}`}>
                  {nombreRol}
                </p>
              </div>
            </button>

            {/* Dropdown del menú */}
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-graphite-200 dark:border-[#24334A] surgical:border-[#475569] rounded-xl shadow-lg overflow-hidden z-50"
              >
                {/* Header del menú: identidad completa */}
                <div className="px-4 py-3 border-b border-graphite-200 dark:border-[#24334A] surgical:border-[#475569]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-graphite-300 dark:bg-graphite-700 rounded-full flex items-center justify-center font-semibold text-graphite-700 dark:text-graphite-200 text-base flex-shrink-0">
                      {inicial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-graphite-900 dark:text-graphite-50 truncate" title={userProfile?.nombreCompleto}>
                        {userProfile?.nombreCompleto || 'Mi sesión'}
                      </p>
                      <p className="text-xs text-graphite-500 dark:text-graphite-400 truncate" title={userProfile?.email}>
                        {userProfile?.email}
                      </p>
                      <div className="mt-1">
                        <Badge size="sm" variant="neutral">{nombreRol}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items del menú (theme toggle en menú) */}
                <div className="py-1">
                  {handleToggleTheme && (
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        handleToggleTheme()
                        setMenuOpen(false)
                      }}
                      aria-label={themeInfo.label}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-graphite-700 dark:text-graphite-200 hover:bg-graphite-100 dark:hover:bg-graphite-700 transition-colors surgical:min-h-[48px]"
                    >
                      <Icon icon={themeInfo.icon} size="sm" />
                      <span className="flex-1 text-left">
                        {themeInfo.label}
                      </span>
                    </button>
                  )}

                  <div className="h-px bg-graphite-200 dark:bg-graphite-700 my-1" />

                  <button
                    role="menuitem"
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-clinical-error hover:bg-clinical-error/10 transition-colors surgical:min-h-[48px]"
                  >
                    <Icon icon={LogOut} size="sm" />
                    <span className="flex-1 text-left">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout button (siempre visible, contrato tests) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="text-clinical-error hover:bg-clinical-error/10 surgical:min-w-[48px] surgical:min-h-[48px]"
            data-touch-target="critical"
          >
            <Icon icon={LogOut} size="md" />
          </Button>
        </div>
      </div>
    </header>
  )
}
