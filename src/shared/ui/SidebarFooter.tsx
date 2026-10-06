/**
 * SidebarFooter — Footer unificado del Sidebar (Blueprint 02 + 03)
 *
 * Layout de 3 líneas estricto:
 * 1. ThemeSwitcher (compact o completo)
 * 2. Conectividad + Dispositivos (en 64px: solo punto de conexión centrado)
 * 3. Versión de la app (v1.0.0 · DentikOS)
 */
import React from 'react'
import { ConnectionIndicator } from './ConnectionIndicator'
import { DeviceIndicator } from './DeviceIndicator'
import { ThemeSwitcher } from './ThemeSwitcher'

export interface SidebarFooterProps {
  compact?: boolean
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ compact = false }) => (
  <div className="px-2 pb-4 space-y-3 overflow-hidden">
    <ThemeSwitcher compact={compact} />
    <div className={`flex items-center gap-2 min-w-0 ${compact ? 'justify-center' : 'justify-between'}`}>
      <ConnectionIndicator compact={compact} />
      {!compact && <DeviceIndicator compact={compact} />}
    </div>
    {!compact && (
      <p className="text-[10px] text-graphite-400 dark:text-graphite-500 text-center truncate">
        v1.0.0 · DentikOS
      </p>
    )}
  </div>
)

SidebarFooter.displayName = 'SidebarFooter'
