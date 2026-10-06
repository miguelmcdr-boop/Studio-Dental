/**
 * SidebarFooter — Footer unificado del Sidebar (Blueprint 02 + 03)
 *
 * Combina en una sola línea:
 * - Estado de conexión (ConnectionIndicator)
 * - Sesiones activas (DeviceIndicator)
 * - Versión de la app (v1.0.0)
 *
 * Reemplaza la duplicación visual de dos puntos verdes solapados.
 */
import React from 'react'
import { ConnectionIndicator } from './ConnectionIndicator'
import { DeviceIndicator } from './DeviceIndicator'
import { ThemeSwitcher } from './ThemeSwitcher'

export interface SidebarFooterProps {
  compact?: boolean
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ compact = false }) => (
  <div className={`px-2 pb-4 space-y-3 ${compact ? 'text-center overflow-hidden' : ''}`}>
    {/* ThemeSwitcher siempre visible encima */}
    <ThemeSwitcher compact={compact} />

    {/* Línea única combinando conectividad + dispositivos */}
    <div className={`flex items-center ${compact ? 'flex-col items-center justify-center gap-1.5' : 'justify-between gap-2'}`}>
      <ConnectionIndicator compact={compact} />
      <DeviceIndicator compact={compact} />
    </div>

    {/* Versión de la app */}
    {!compact && (
      <p className="text-[10px] text-graphite-400 dark:text-graphite-500 text-center">
        v1.0.0 · DentikOS
      </p>
    )}
  </div>
)

SidebarFooter.displayName = 'SidebarFooter'
