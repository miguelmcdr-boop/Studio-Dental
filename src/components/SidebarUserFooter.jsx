/**
 * SidebarUserFooter — Identidad y logout del Sidebar (F10-B2)
 *
 * Extraído de Sidebar.jsx para respetar su límite congelado de allowlist.
 * Se retirará en F10-B3 cuando la identidad pase al avatar-menu del TopBar.
 */
import React from 'react'
import { LogOut } from 'lucide-react'
import { Icon } from './Icon'
import { NOMBRES_ROLES } from '../constants/rbacConstants'

export const SidebarUserFooter = ({ userProfile, rol, colapsado, onLogout }) => {
  const inicial = userProfile?.nombreCompleto
    ? userProfile.nombreCompleto.replace('Dr. ', '').replace('Dra. ', '').charAt(0).toUpperCase()
    : 'D'

  const nombreRol = NOMBRES_ROLES[rol] || 'Usuario'

  return (
    <div className="border-t border-graphite-200 dark:border-graphite-700 pt-4 mt-6">
      <div className={`flex items-center gap-3 mb-2 ${colapsado ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-graphite-300 dark:bg-graphite-700 rounded-full flex items-center justify-center font-semibold text-graphite-700 dark:text-graphite-200 text-xs">
          {inicial}
        </div>
        {!colapsado && (
          <div className="text-[11px] overflow-hidden flex-1">
            <p className="font-semibold text-graphite-800 dark:text-graphite-100 truncate" title={userProfile?.nombreCompleto}>
              {userProfile?.nombreCompleto || 'Mi sesión'}
            </p>
            <p className="text-graphite-500 dark:text-graphite-400 truncate" title={userProfile?.email}>
              {userProfile?.email}
            </p>
            <p className="text-graphite-400 dark:text-graphite-500 truncate italic" title={`Rol: ${nombreRol}`}>
              {nombreRol}
            </p>
          </div>
        )}
      </div>
      {!colapsado ? (
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 text-left text-xs font-medium text-clinical-error hover:text-red-800 dark:hover:text-red-400 pt-1 px-3 py-2 rounded-lg hover:bg-graphite-200/60 dark:hover:bg-graphite-800 transition-colors"
        >
          <Icon icon={LogOut} size="sm" />
          <span>Cerrar sesión</span>
        </button>
      ) : (
        <button
          onClick={onLogout}
          className="w-full flex justify-center text-clinical-error hover:text-red-800 dark:hover:text-red-400 pt-1 p-2 rounded-lg hover:bg-graphite-200/60 dark:hover:bg-graphite-800 transition-colors"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <Icon icon={LogOut} size="md" />
        </button>
      )}
    </div>
  )
}

SidebarUserFooter.displayName = 'SidebarUserFooter'
