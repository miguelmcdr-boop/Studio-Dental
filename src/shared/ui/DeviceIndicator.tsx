/**
 * DeviceIndicator — Indicador multi-dispositivo en footer del Sidebar
 * Blueprint 02 §05: Sesiones activas reales vía useSessionDevices
 */
import React, { useState } from 'react'
import { useSessionDevices } from '../hooks/useSessionDevices'

export interface DeviceIndicatorProps {
  compact?: boolean
  className?: string
}

export const DeviceIndicator: React.FC<DeviceIndicatorProps> = ({ compact = false, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false)
  const { devices } = useSessionDevices()

  const count = devices.length
  const label = count === 1 ? '1 dispositivo activo' : `${count} dispositivos activos`
  const tooltipText = count > 0
    ? devices.map((d) => `${d.nombre}${d.esActual ? ' (esta sesión)' : ''}`).join(' · ')
    : 'Esta sesión activa'

  if (compact) {
    return (
      <div
        className={`relative flex items-center justify-center p-1.5 cursor-pointer ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={tooltipText}
        aria-label={label}
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
      title={tooltipText}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
      <span className="truncate font-medium">{count === 0 ? 'Esta sesión' : label}</span>

      {showTooltip && (
        <div className="absolute bottom-full left-2 mb-1 z-50 px-2.5 py-1.5 text-[10px] bg-graphite-900 text-white rounded-md shadow-lg whitespace-nowrap pointer-events-none">
          <p className="font-semibold text-gold-satin">Sesiones activas:</p>
          {devices.length === 0 ? (
            <p>• Esta sesión activa</p>
          ) : (
            devices.map((d) => (
              <p key={d.id}>• {d.nombre} {d.esActual ? '(esta sesión)' : `(${d.ultimaActividad})`}</p>
            ))
          )}
        </div>
      )}
    </div>
  )
}
