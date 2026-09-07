/**
 * TopBar — App Shell del Design System (F7-25 Fase 4, Iteración 2)
 *
 * Barra superior de la aplicación con:
 * - Logo/marca
 * - ClinicaSelector (movido del Sidebar)
 * - Toggle dark mode
 * - Avatar + nombre + rol del usuario
 * - Botón logout
 *
 * Uso:
 *   <TopBar
 *     userProfile={userProfile}
 *     onLogout={handleLogout}
 *     darkMode={darkMode}
 *     onToggleDarkMode={toggleDarkMode}
 *     onCambioClinica={handleCambioClinica}
 *   />
 */
import React from 'react'
import { LogOut, Moon, Sun } from 'lucide-react'
import { Icon } from './Icon'
import { Button } from './ui/Button'
import { ClinicaSelector } from './ClinicaSelector'
import { NOMBRES_ROLES } from '../constants/rbacConstants'

export const TopBar = ({
  userProfile,
  onLogout,
  darkMode = false,
  onToggleDarkMode,
  onCambioClinica,
}) => {
  const inicial = userProfile?.nombreCompleto
    ? userProfile.nombreCompleto.replace('Dr. ', '').replace('Dra. ', '').charAt(0).toUpperCase()
    : 'U'

  const nombreRol = NOMBRES_ROLES[userProfile?.rol] || 'Usuario'

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-graphite-900 border-b border-graphite-200 dark:border-graphite-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 h-16">
        {/* Izquierda: Logo + ClinicaSelector */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center font-bold text-base text-white">
              C
            </div>
            <span className="font-bold text-base text-graphite-900 dark:text-graphite-50 hidden md:block">
              Consulta
            </span>
          </div>

          {/* Separator */}
          <div className="h-8 w-px bg-graphite-200 dark:bg-graphite-700 hidden md:block" />

          {/* ClinicaSelector (movido del Sidebar) */}
          <div className="hidden md:block">
            <ClinicaSelector onCambioClinica={onCambioClinica} />
          </div>
        </div>

        {/* Derecha: Dark mode toggle + Avatar + Logout */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
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

          {/* Separator */}
          <div className="h-8 w-px bg-graphite-200 dark:bg-graphite-700" />

          {/* User info */}
          <div className="flex items-center gap-3">
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
          </div>

          {/* Logout button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
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
