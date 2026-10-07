/**
 * TopBarBreadcrumbs — Ruta de navegación con separador · (punto medio), timer e isDirty
 * Blueprint 03
 */
import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useTopBarStore, type BreadcrumbItem } from '../../app/stores/useTopBarStore'
import { playSound } from '../utils/soundEffects'

import { useGuardadoState } from '../hooks/useGuardadoState'

export interface TopBarBreadcrumbsProps {
  items: BreadcrumbItem[]
  pacienteId?: string | null
}

export const TopBarBreadcrumbs: React.FC<TopBarBreadcrumbsProps> = ({ items, pacienteId }) => {
  const guardadoStatus = useGuardadoState()
  const timerStart = useTopBarStore((s) => s.timerStart)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!pacienteId || !timerStart) {
      setElapsed(0)
      return
    }
    const interval = setInterval(() => {
      setElapsed(Date.now() - timerStart)
    }, 1000)
    return () => clearInterval(interval)
  }, [pacienteId, timerStart])

  const formatTimer = (ms: number): string => {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const timerColor =
    elapsed > 30 * 60 * 1000
      ? 'text-rose-500 font-bold'
      : elapsed > 15 * 60 * 1000
      ? 'text-amber-500 font-semibold'
      : 'text-graphite-400'

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs">
        <ol className="flex items-center gap-1.5">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1
            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <span className="text-graphite-300 dark:text-graphite-600 font-bold select-none">
                    ·
                  </span>
                )}
                {isLast ? (
                  <span
                    className="font-semibold text-primary truncate max-w-[180px]"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('breadcrumbClick')
                      item.onClick?.()
                    }}
                    className="text-graphite-500 dark:text-graphite-400 hover:text-primary transition-colors truncate max-w-[140px] hover:underline cursor-pointer"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Timer de atención cuando hay paciente activo */}
      {pacienteId && timerStart && (
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded bg-graphite-100 dark:bg-graphite-800 shrink-0 ${timerColor}`}
          title="Tiempo transcurrido en ficha del paciente"
        >
          ⏱ {formatTimer(elapsed)}
        </span>
      )}

      {/* Estado derivado de guardado (BP03 §08 Feature 3) */}
      {guardadoStatus === 'dirty' && (
        <div data-testid="topbar-dirty-indicator" className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="hidden lg:inline">Cambios sin guardar</span>
        </div>
      )}

      {guardadoStatus === 'saved' && (
        <div data-testid="topbar-saved-indicator" className="flex items-center gap-1 text-[11px] text-[#0D9488] dark:text-teal-400 shrink-0 transition-opacity duration-300">
          <Check size={12} className="text-[#0D9488]" />
          <span className="hidden lg:inline">Guardado</span>
        </div>
      )}
    </div>
  )
}
