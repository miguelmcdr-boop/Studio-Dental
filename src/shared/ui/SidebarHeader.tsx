/**
 * SidebarHeader — Cabecera del Sidebar con logo, identidad de clínica y toggle
 * Blueprint 02 §05: Logo DentikOS + Identidad de clínica bajo el logo (modo expandido)
 */
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DentikOSLogo } from './brand/DentikOSLogo'

export interface SidebarHeaderProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  clinicaNombre: string
  sedeNombre: string
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
  clinicaNombre,
  sedeNombre,
}) => {
  return (
    <div className="mb-4">
      {/* Fila superior: Logo + Botón Toggle */}
      <div className={`px-1 mb-2 ${isCollapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between min-h-[36px]'}`}>
        <div className={`${isCollapsed ? 'mx-auto' : ''} flex items-center overflow-hidden`}>
          <DentikOSLogo
            variant={isCollapsed ? 'icon-only' : 'horizontal'}
            size="sm"
            opticalSize={isCollapsed ? 'micro' : 'standard'}
          />
        </div>

        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          data-testid="sidebar-toggle"
          className="p-1.5 rounded-lg hover:bg-graphite-200/60 dark:hover:bg-graphite-800 text-graphite-500 hover:text-graphite-900 dark:hover:text-gold-satin transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Identidad de Clínica y Sede (solo visible en modo expandido) */}
      {!isCollapsed && (
        <div className="px-2 pt-1 border-t border-surface/50">
          <p
            className="text-[12px] font-semibold text-graphite-900 dark:text-graphite-50 truncate"
            title={clinicaNombre}
          >
            {clinicaNombre}
          </p>
          <p
            className="text-[11px] text-graphite-500 dark:text-graphite-400 truncate mt-0.5"
            title={sedeNombre}
          >
            {sedeNombre}
          </p>
        </div>
      )}
    </div>
  )
}

SidebarHeader.displayName = 'SidebarHeader'
