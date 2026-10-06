/**
 * SidebarFooter — Footer unificado del Sidebar (Blueprint 02 + 03)
 *
 * En modo expandido: 3 líneas (ThemeSwitcher, Conexión + Dispositivos, Versión)
 * En modo compacto (64px): centrado vertical estricto sin desborde (ThemeSwitcher 36px, Conexión, Dispositivos)
 */
import React from 'react'
import { ConnectionIndicator } from './ConnectionIndicator'
import { DeviceIndicator } from './DeviceIndicator'
import { ThemeSwitcher } from './ThemeSwitcher'

export interface SidebarFooterProps {
  compact?: boolean
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div
        data-testid="sidebar-footer-compact"
        className="w-full flex flex-col items-center gap-1.5 pb-2 overflow-visible"
      >
        <ThemeSwitcher compact={true} />
        <ConnectionIndicator compact={true} />
        <DeviceIndicator compact={true} />
      </div>
    )
  }

  return (
    <div data-testid="sidebar-footer-expanded" className="px-2 pb-4 space-y-3 overflow-hidden">
      <ThemeSwitcher compact={false} />
      <div className="flex items-center gap-2 min-w-0 justify-between">
        <ConnectionIndicator compact={false} />
        <DeviceIndicator compact={false} />
      </div>
      <p className="text-[10px] text-graphite-400 dark:text-graphite-500 text-center truncate">
        v1.0.0 · DentikOS
      </p>
    </div>
  )
}

SidebarFooter.displayName = 'SidebarFooter'
