/**
 * Sidebar con control de acceso por rol (F3-05) + Design System v2 (F10-B2).
 *
 * F10-B2: navegación agrupada en 4 secciones con labels, soporte de
 * contadores vía props (conexión a datos reales en B2.5) y item activo
 * en graphite-900 (champagne reservado para marca).
 *
 * Contratos preservados:
 * - data-testid="sidebar-menu-{slug}" (tests)
 * - aria-current="page" en item activo
 * - RBAC: permisoRequerido por item (definidos en sidebarConstants)
 * - Toggle de colapso manual
 */
import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRBAC } from '../hooks/useRBAC'
import { ConnectionIndicator } from './ConnectionIndicator'
import { SidebarUserFooter } from './SidebarUserFooter'
import { Icon } from './Icon'
import { Badge } from './ui/Badge'
import { SECCIONES_SIDEBAR } from '../constants/sidebarConstants'

export const Sidebar = ({ userProfile, activeSection, setActiveSection, onLogout, counters = {} }) => {
  const [colapsado, setColapsado] = useState(false)
  const { puede, rol } = useRBAC()

  // Filtrar items por permiso y ocultar secciones que queden vacías
  const seccionesVisibles = useMemo(() => (
    SECCIONES_SIDEBAR.map(seccion => ({
      ...seccion,
      items: seccion.items.filter(item => !item.permisoRequerido || puede(item.permisoRequerido)),
    })).filter(seccion => seccion.items.length > 0)
  ), [puede])

  const renderItem = (item) => {
    const activo = activeSection === item.name
    const contador = item.counterKey ? counters[item.counterKey] : undefined
    const muestraContador = typeof contador === 'number' && contador > 0

    return (
      <button
        key={item.name}
        data-testid={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={() => setActiveSection(item.name)}
        title={colapsado ? item.name : ''}
        aria-current={activo ? 'page' : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
          activo
            ? 'bg-graphite-900 text-white shadow-sm dark:bg-graphite-100 dark:text-graphite-900'
            : 'text-graphite-700 dark:text-graphite-300 hover:bg-graphite-200/60 dark:hover:bg-graphite-800'
        } ${colapsado ? 'justify-center' : ''}`}
      >
        <Icon icon={item.icon} size="md" />
        {!colapsado && (
          <>
            <span className="flex-1 text-left">{item.name}</span>
            {muestraContador && (
              <Badge size="sm" variant={item.counterVariant || 'neutral'}>
                {contador}
              </Badge>
            )}
          </>
        )}
      </button>
    )
  }

  return (
    <aside className={`${colapsado ? 'w-20' : 'w-64'} bg-graphite-50 dark:bg-graphite-900 p-4 border-r border-graphite-200 dark:border-graphite-700 min-h-screen flex flex-col justify-between transition-all duration-300 print:hidden relative`}>
      <div>
        {/* Logo + toggle de colapso */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className={`${colapsado ? 'mx-auto' : ''} flex items-center gap-3`}>
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center font-bold text-base text-white">C</div>
            {!colapsado && (
              <span className="font-bold text-base text-graphite-800 dark:text-graphite-50">Consulta</span>
            )}
          </div>

          <button
            onClick={() => setColapsado(!colapsado)}
            className="p-1.5 rounded-lg hover:bg-graphite-200 dark:hover:bg-graphite-700 text-graphite-500 dark:text-graphite-400 hover:text-graphite-900 dark:hover:text-graphite-50 transition-colors"
            title={colapsado ? 'Expandir menú' : 'Minimizar menú'}
            aria-label={colapsado ? 'Expandir menú' : 'Minimizar menú'}
          >
            <Icon icon={colapsado ? ChevronRight : ChevronLeft} size="sm" />
          </button>
        </div>

        {/* Navegación por secciones */}
        <nav aria-label="Navegacion principal" className="space-y-5">
          {seccionesVisibles.map((seccion) => (
            <div key={seccion.label}>
              {!colapsado ? (
                <p
                  className="px-3 mb-1.5 text-graphite-400 dark:text-graphite-500 font-semibold uppercase tracking-wider"
                  style={{ fontSize: '10px' }}
                >
                  {seccion.label}
                </p>
              ) : (
                <div className="h-px bg-graphite-200 dark:bg-graphite-700 mx-2 mb-2" aria-hidden="true" />
              )}
              <div className="space-y-1">
                {seccion.items.map(renderItem)}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <SidebarUserFooter userProfile={userProfile} rol={rol} colapsado={colapsado} onLogout={onLogout} />

      <div className="px-2 mb-4">
        <ConnectionIndicator />
      </div>
    </aside>
  )
}
