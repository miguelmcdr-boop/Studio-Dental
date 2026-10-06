/**
 * Sidebar — Blueprint 02: 5 Categorías Core, Trazo de Cera Quirúrgico y Cascada Framer Motion
 * Respetando arquitectura DDD y límite estricto de 250 líneas.
 */
import React, { useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRBAC } from '../hooks/useRBAC'
import { SidebarHeader } from './SidebarHeader'
import { SidebarFooter } from './SidebarFooter'
import { Icon } from './Icon'
import { Badge } from './ui/Badge'
import { useSidebarStore } from '../../app/stores/useSidebarStore'
import { useDarkMode } from '../hooks/useDarkMode'
import { useSedes } from '../../domains/organization/clinic/hooks/useSedes'
import { SECCIONES_SIDEBAR, type SidebarItem, type SidebarSeccion } from '../../constants/sidebarConstants'
import type { PerfilUsuario } from '../../infrastructure/auth/authService'
import type { SidebarCountersReturn } from '../hooks/useSidebarCounters'

const playTrazoCeraSound = () => {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.setValueAtTime(1200, now)
    gain.gain.setValueAtTime(0.025, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.015)
  } catch {
    // Ignore audio failures
  }
}

export interface SidebarProps {
  userProfile?: PerfilUsuario | null
  activeSection: string
  setActiveSection: (section: string) => void
  onLogout?: () => void
  counters?: SidebarCountersReturn | Record<string, number | undefined>
}

export const Sidebar: React.FC<SidebarProps> = ({
  userProfile,
  activeSection,
  setActiveSection,
  counters = {},
}) => {
  const mode = useSidebarStore((s) => s.mode)
  const setMode = useSidebarStore((s) => s.setMode)
  const focusMode = useSidebarStore((s) => s.focusMode)
  const { theme } = useDarkMode()
  const { puede } = useRBAC()
  const { sedeActiva } = useSedes()

  const isCollapsed = mode === 'collapsed'
  const clinicaNombre = typeof userProfile?.clinicaNombre === 'string' ? userProfile.clinicaNombre : 'Studio Dental'
  const sedeNombre = sedeActiva?.nombre || 'Sede Principal'

  useEffect(() => {
    // Auto-colapsar al activar modo quirúrgico
    if (theme === 'surgical') setMode('collapsed')
  }, [theme, setMode])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(max-width: 1024px)')
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setMode('collapsed')
    }
    handleChange(mql)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [setMode])

  const seccionesVisibles = useMemo((): SidebarSeccion[] => (
    SECCIONES_SIDEBAR.map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => !item.permisoRequerido || puede(item.permisoRequerido)),
    })).filter((sec) => sec.items.length > 0)
  ), [puede])

  const handleItemClick = useCallback((name: string) => {
    playTrazoCeraSound()
    setActiveSection(name)
  }, [setActiveSection])

  if (focusMode) return null

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-60'} bg-white dark:bg-graphite-950 surgical:bg-graphite-300 p-3 border-r border-surface min-h-screen flex flex-col justify-between transition-[width] duration-300 select-none print:hidden z-30`}
      role="navigation"
      aria-label="Menú principal"
    >
      <div>
        {/* Header: Logo DentikOS + Identidad + Toggle colapso */}
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setMode(isCollapsed ? 'expanded' : 'collapsed')}
          clinicaNombre={clinicaNombre}
          sedeNombre={sedeNombre}
        />

        {/* 5 Categorías Core en cascada Framer Motion */}
        <motion.nav
          aria-label="Navegacion principal"
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
        >
          {seccionesVisibles.map((seccion) => (
            <div key={seccion.label}>
              {!isCollapsed ? (
                <p className="px-2 mb-1 text-[10px] text-graphite-400 dark:text-graphite-500 font-bold uppercase tracking-wider">
                  {seccion.label}
                </p>
              ) : (
                <div className="h-px bg-graphite-200 dark:bg-graphite-800 mx-1 mb-1.5" aria-hidden="true" />
              )}

              <div className="space-y-0.5">
                {seccion.items.map((item) => {
                  const activo = activeSection === item.name || (item.slug === 'urgencias-ges' && activeSection === 'Urgencias y GES')
                  const contador = item.counterKey ? (counters as Record<string, unknown>)[item.counterKey] : undefined
                  const muestraContador = typeof contador === 'number' && contador > 0

                  return (
                    <motion.div
                      key={item.slug}
                      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                    >
                      <button
                        data-testid={`sidebar-menu-${item.slug}`}
                        data-legacy-testid={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => handleItemClick(item.name)}
                        title={isCollapsed ? (muestraContador ? `${item.name} (${contador})` : item.name) : undefined}
                        aria-current={activo ? 'page' : undefined}
                        className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group overflow-hidden ${
                          activo
                            ? 'bg-gold-light/60 text-champagne-700 shadow-xs dark:bg-surface dark:text-gold-satin surgical:bg-white surgical:text-black font-bold'
                            : 'text-graphite-700 dark:text-graphite-300 hover:bg-graphite-100 dark:hover:bg-graphite-800/70'
                        } ${isCollapsed ? 'justify-center px-1' : ''}`}
                      >
                        {/* Trazo de Cera Quirúrgica en item activo */}
                        {activo && (
                          <motion.div
                            layoutId="sidebar-active-border"
                            className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r"
                            initial={{ height: 0 }}
                            animate={{ height: '100%' }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <span className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-sm" />
                          </motion.div>
                        )}

                        <motion.div
                          animate={activo ? { scale: [1.0, 1.08, 1.0] } : { scale: 1.0 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center justify-center flex-shrink-0"
                        >
                          <Icon
                            icon={item.icon}
                            size="md"
                            className={activo ? 'text-primary surgical:text-black' : 'text-graphite-500 group-hover:text-graphite-900 dark:group-hover:text-gold-satin'}
                          />
                        </motion.div>

                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left truncate">{item.name}</span>
                            {muestraContador && (
                              <Badge size="sm" variant={item.counterVariant || 'neutral'}>
                                {contador}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </motion.nav>
      </div>

      {/* Footer: SidebarFooter unificado */}
      <div className="pt-3 border-t border-surface px-1">
        <SidebarFooter compact={isCollapsed} />
      </div>
    </aside>
  )
}

Sidebar.displayName = 'Sidebar'
