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
import { LogOut, Moon, Sun } from 'lucide-react'
import { Icon } from './Icon'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { ClinicaSelector } from './ClinicaSelector'
import { NOMBRES_ROLES } from '../constants/rbacConstants'

export const TopBar = ({
  userProfile,
  onLogout,
  darkMode = false,
  onToggleDarkMode,
  onCambioClinica,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

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
    <header className="sticky top-0 z-40 bg-white dark:bg-graphite-900 border-b border-graphite-200 dark:border-graphite-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 h-16">
        {/* Izquierda: Logo + ClinicaSelector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center font-bold text-base text-white">
              C
            </div>
            <span className="font-bold text-base text-graphite-900 dark:text-graphite-50 hidden md:block">
              Consulta
            </span>
          </div>

          <div className="h-8 w-px bg-graphite-200 dark:bg-graphite-700 hidden md:block" />

          <div className="hidden md:block">
            <ClinicaSelector onCambioClinica={onCambioClinica} />
          </div>
        </div>

        {/* Derecha: Dark mode toggle + Avatar + menú + Logout */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle (siempre visible, contrato tests) */}
          {onToggleDarkMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              <Icon icon={darkMode ? Sun : Moon} size="md" />
            </Button>
          )}

          <div className="h-8 w-px bg-graphite-200 dark:bg-graphite-700" />

          {/* Avatar + menú */}
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
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-xl shadow-lg overflow-hidden z-50"
              >
                {/* Header del menú: identidad completa */}
                <div className="px-4 py-3 border-b border-graphite-200 dark:border-graphite-700">
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

                {/* Items del menú (dark toggle duplicado para accesibilidad en menú) */}
                <div className="py-1">
                  {onToggleDarkMode && (
                    <button
                      role="menuitem"
                      type="button"
                      onClick={onToggleDarkMode}
                      aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-graphite-700 dark:text-graphite-200 hover:bg-graphite-100 dark:hover:bg-graphite-700 transition-colors"
                    >
                      <Icon icon={darkMode ? Sun : Moon} size="sm" />
                      <span className="flex-1 text-left">
                        {darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
                      </span>
                    </button>
                  )}

                  <div className="h-px bg-graphite-200 dark:bg-graphite-700 my-1" />

                  <button
                    role="menuitem"
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-clinical-error hover:bg-clinical-error/10 transition-colors"
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
            className="text-clinical-error hover:bg-clinical-error/10"
          >
            <Icon icon={LogOut} size="md" />
          </Button>
        </div>
      </div>
    </header>
  )
}
