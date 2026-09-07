/**
 * Sidebar con control de acceso por rol (F3-05) + Design System (F7-25).
 *
 * Cada ítem del menú puede tener un campo opcional `permisoRequerido`.
 * Si no lo tiene, siempre es visible para todos los roles.
 * Si lo tiene, solo se renderiza si el usuario actual tiene ese permiso.
 *
 * F7-25: Migración de emojis a lucide-react (iconografía profesional consistente).
 */
import React, { useState, useMemo } from 'react'
import { useRBAC } from '../hooks/useRBAC'
import { PERMISOS, NOMBRES_ROLES } from '../constants/rbacConstants'
import { ConnectionIndicator } from './ConnectionIndicator'
import { Icon } from './Icon'
import {
  Calendar, LayoutDashboard, Users, Siren, FileText, CreditCard, Mail,
  Sparkles, FlaskConical, Package, Stethoscope, DollarSign, BarChart3,
  UsersRound, Pill, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'

export const Sidebar = ({ userProfile, activeSection, setActiveSection, onLogout }) => {
  const [colapsado, setColapsado] = useState(false)
  const { puede, rol } = useRBAC()

  // F7-25: Menú con iconos lucide-react (reemplaza emojis)
  const menuItems = useMemo(() => [
    // Módulos siempre visibles (trabajo diario clínico)
    { name: 'Agenda', icon: Calendar },
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Pacientes', icon: Users },
    { name: 'Urgencias y GES', icon: Siren },
    { name: 'Presupuestos', icon: FileText },
    { name: 'Pagos', icon: CreditCard },
    { name: 'Comunicaciones', icon: Mail },

    // Módulos clínicos de soporte (visibles para clínico y admin)
    { name: 'Esterilización', icon: Sparkles, permisoRequerido: PERMISOS.VER_ESTERILIZACION },
    { name: 'Laboratorio', icon: FlaskConical, permisoRequerido: PERMISOS.VER_LABORATORIO },
    { name: 'Inventario', icon: Package, permisoRequerido: PERMISOS.VER_INVENTARIO },

    // Módulos financieros (visibles para admin y dentista)
    { name: 'Prestaciones', icon: Stethoscope, permisoRequerido: PERMISOS.EDITAR_PRECIOS },
    { name: 'Finanzas', icon: DollarSign, permisoRequerido: PERMISOS.VER_FINANZAS },
    { name: 'Reportes', icon: BarChart3, permisoRequerido: PERMISOS.VER_REPORTES },

    // Módulos administrativos
    { name: 'Miembros', icon: UsersRound, permisoRequerido: PERMISOS.GESTIONAR_USUARIOS },
    { name: 'Vademécum', icon: Pill, permisoRequerido: PERMISOS.ADMINISTRAR_VADEMECUM },
    { name: 'Configuración', icon: Settings, permisoRequerido: PERMISOS.VER_CONFIGURACION }
  ], [])

  const menuItemsVisibles = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.permisoRequerido) return true
      return puede(item.permisoRequerido)
    })
  }, [menuItems, puede])

  const inicial = userProfile?.nombreCompleto
    ? userProfile.nombreCompleto.replace('Dr. ', '').replace('Dra. ', '').charAt(0).toUpperCase()
    : 'D'

  const nombreRol = NOMBRES_ROLES[rol] || 'Usuario'

  return (
    <aside className={`${colapsado ? 'w-20' : 'w-64'} bg-graphite-50 dark:bg-graphite-900 p-4 border-r border-graphite-200 dark:border-graphite-700 min-h-screen flex flex-col justify-between transition-all duration-300 print:hidden relative`}>
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          {!colapsado && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center font-bold text-base text-white">C</div>
              <span className="font-bold text-base text-graphite-800 dark:text-graphite-50">Consulta</span>
            </div>
          )}

          {colapsado && (
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center font-bold text-base text-white mx-auto">C</div>
          )}

          <button
            onClick={() => setColapsado(!colapsado)}
            className="p-1.5 rounded-lg hover:bg-graphite-200 dark:hover:bg-graphite-700 text-graphite-500 dark:text-graphite-400 hover:text-graphite-900 dark:hover:text-graphite-50 transition-colors"
            title={colapsado ? "Expandir menú" : "Minimizar menú"}
            aria-label={colapsado ? "Expandir menú" : "Minimizar menú"}
          >
            <Icon icon={colapsado ? ChevronRight : ChevronLeft} size="sm" />
          </button>
        </div>

        <nav aria-label="Navegacion principal" className="space-y-1">
          {menuItemsVisibles.map((item) => (
            <button
              key={item.name}
              data-testid={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveSection(item.name)}
              title={colapsado ? item.name : ''}
              aria-current={activeSection === item.name ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeSection === item.name
                  ? 'bg-primary text-white shadow-md'
                  : 'text-graphite-700 dark:text-graphite-300 hover:bg-graphite-200/60 dark:hover:bg-graphite-800'
              } ${colapsado ? 'justify-center' : ''}`}
            >
              <Icon icon={item.icon} size="md" />
              {!colapsado && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-graphite-200 dark:border-graphite-700 pt-4 mt-6">
        <div className={`flex items-center gap-3 mb-2 ${colapsado ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-graphite-300 dark:bg-graphite-700 rounded-full flex items-center justify-center font-semibold text-graphite-700 dark:text-graphite-200 text-xs">{inicial}</div>
          {!colapsado && (
            <div className="text-[11px] overflow-hidden flex-1">
              <p className="font-semibold text-graphite-800 dark:text-graphite-100 truncate" title={userProfile?.nombreCompleto}>{userProfile?.nombreCompleto || 'Mi sesión'}</p>
              <p className="text-graphite-500 dark:text-graphite-400 truncate" title={userProfile?.email}>{userProfile?.email}</p>
              <p className="text-graphite-400 dark:text-graphite-500 truncate italic" title={`Rol: ${nombreRol}`}>{nombreRol}</p>
            </div>
          )}
        </div>
        {!colapsado ? (
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-left text-xs font-medium text-clinical-error hover:text-red-800 dark:hover:text-red-400 pt-1 px-3 py-2 rounded-lg hover:bg-graphite-200/60 dark:hover:bg-graphite-800 transition-colors">
            <Icon icon={LogOut} size="sm" />
            <span>Cerrar sesión</span>
          </button>
        ) : (
          <button onClick={onLogout} className="w-full flex justify-center text-clinical-error hover:text-red-800 dark:hover:text-red-400 pt-1 p-2 rounded-lg hover:bg-graphite-200/60 dark:hover:bg-graphite-800 transition-colors" title="Cerrar sesión" aria-label="Cerrar sesión">
            <Icon icon={LogOut} size="md" />
          </button>
        )}
      </div>
      <div className="px-2 mb-4">
        <ConnectionIndicator />
      </div>
    </aside>
  )
}
