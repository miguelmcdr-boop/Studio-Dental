/**
 * DeviceIndicator — Indicador multi-dispositivo en footer del Sidebar
 * Blueprint 02: 🟢 2 dispositivos activos (Desktop + iPad Box)
 */
import React, { useState } from 'react'

export interface DeviceIndicatorProps {
  compact?: boolean
  className?: string
}

export const DeviceIndicator: React.FC<DeviceIndicatorProps> = ({ compact = false, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  if (compact) {
    return (
      <div
        className={`relative flex items-center justify-center p-1.5 cursor-pointer ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title="2 dispositivos activos: Desktop (esta sesión) · iPad Box 3"
        aria-label="2 dispositivos activos"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div
      className={`relative flex items-center gap-2 px-2 py-1 text-[11px] text-graphite-500 dark:text-graphite-400 cursor-pointer select-none rounded-lg hover:bg-graphite-100 dark:hover:bg-graphite-800/60 transition-colors ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title="Desktop (esta sesión) · iPad Box 3"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
      <span className="truncate font-medium">2 dispositivos activos</span>

      {showTooltip && (
        <div className="absolute bottom-full left-2 mb-1 z-50 px-2.5 py-1.5 text-[10px] bg-graphite-900 text-white rounded-md shadow-lg whitespace-nowrap pointer-events-none">
          <p className="font-semibold text-gold-satin">Sesiones activas:</p>
          <p>• Desktop (esta sesión)</p>
          <p>• iPad Box 3 (hace 4m)</p>
        </div>
      )}
    </div>
  )
}
