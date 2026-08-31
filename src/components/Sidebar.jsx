import React, { useState, useMemo } from 'react'
import { useRBAC } from '../hooks/useRBAC'
import { PERMISOS, NOMBRES_ROLES } from '../constants/rbacConstants'
import { ConnectionIndicator } from './ConnectionIndicator'
import { ClinicaSelector } from './ClinicaSelector'

/**
 * Sidebar con control de acceso por rol (F3-05).
 *
 * Cada ítem del menú puede tener un campo opcional `permisoRequerido`.
 * Si no lo tiene, siempre es visible para todos los roles.
 * Si lo tiene, solo se renderiza si el usuario actual tiene ese permiso.
 *
 * Esto garantiza que un usuario no vea en la UI opciones a las que no
 * tiene acceso, mejorando UX (menos ruido) y seguridad (defensa en profundidad).
 */
export const Sidebar = ({ userProfile, activeSection, setActiveSection, onLogout }) => {
  const [colapsado, setColapsado] = useState(false)
  const { puede, rol } = useRBAC()

  // Definición del menú con permisos opcionales (F3-05).
  // Si `permisoRequerido` no está presente, el ítem es visible para todos.
  const menuItems = useMemo(() => [
    // Módulos siempre visibles (trabajo diario clínico)
    { name: 'Agenda', icon: '📅' },
    { name: 'Dashboard', icon: '🎛️' },
    { name: 'Pacientes', icon: '👥' },
    { name: 'Urgencias y GES', icon: '🚨' },
    { name: 'Presupuestos', icon: '📋' },
    { name: 'Pagos', icon: '💳' },
    { name: 'Comunicaciones', icon: '✉️' },

    // Módulos clínicos de soporte (visibles para clínico y admin)
    { name: 'Esterilización', icon: '🧼', permisoRequerido: PERMISOS.VER_ESTERILIZACION },
    { name: 'Laboratorio', icon: '🧪', permisoRequerido: PERMISOS.VER_LABORATORIO },
    { name: 'Inventario', icon: '📦', permisoRequerido: PERMISOS.VER_INVENTARIO },

    // Módulos financieros (visibles para admin y dentista)
    { name: 'Prestaciones', icon: '🦷', permisoRequerido: PERMISOS.EDITAR_PRECIOS },
    { name: 'Finanzas', icon: '💰', permisoRequerido: PERMISOS.VER_FINANZAS },
    { name: 'Reportes', icon: '📊', permisoRequerido: PERMISOS.VER_REPORTES },

    // Módulos administrativos
    { name: 'Miembros', icon: '👥', permisoRequerido: PERMISOS.GESTIONAR_USUARIOS },
    { name: 'Vademécum', icon: '💊', permisoRequerido: PERMISOS.ADMINISTRAR_VADEMECUM },
    { name: 'Configuración', icon: '⚡', permisoRequerido: PERMISOS.VER_CONFIGURACION }
  ], [])

  // Filtrar ítems del menú según permisos del usuario actual (F3-05).
  const menuItemsVisibles = useMemo(() => {
    return menuItems.filter(item => {
      // Si no tiene permisoRequerido, siempre visible
      if (!item.permisoRequerido) return true
      // Si tiene permisoRequerido, verificar con el hook
      return puede(item.permisoRequerido)
    })
  }, [menuItems, puede])

  const inicial = userProfile?.nombreCompleto 
    ? userProfile.nombreCompleto.replace('Dr. ', '').replace('Dra. ', '').charAt(0).toUpperCase() 
    : 'D'

  // Nombre legible del rol para mostrar en la UI (F3-05)
  const nombreRol = NOMBRES_ROLES[rol] || 'Usuario'

  return (
    <aside className={`${colapsado ? 'w-20' : 'w-64'} bg-gray-50 p-4 border-r border-gray-200 min-h-screen flex flex-col justify-between transition-all duration-300 print:hidden relative`}>
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          {!colapsado && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-bold text-base">C</div>
              <span className="font-bold text-base text-gray-800">Consulta</span>
            </div>
          )}

          {colapsado && (
            <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-bold text-base mx-auto">C</div>
          )}

          <button
            onClick={() => setColapsado(!colapsado)}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-black transition-colors"
            title={colapsado ? "Expandir menú" : "Minimizar menú"}
            aria-label={colapsado ? "Expandir menú" : "Minimizar menú"}
          >
            {colapsado ? '▶' : '◀'}
          </button>
        </div>

        {/* F7-10: Selector de clínica activa */}
        {!colapsado && <ClinicaSelector />}

        <nav aria-label="Navegacion principal" className="space-y-1">
          {menuItemsVisibles.map((item) => (
            <button
              key={item.name}
              data-testid={`sidebar-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveSection(item.name)}
              title={colapsado ? item.name : ''}
              aria-current={activeSection === item.name ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeSection === item.name ? 'bg-black text-white shadow-xs' : 'text-gray-700 hover:bg-gray-200/60'
              } ${colapsado ? 'justify-center' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              {!colapsado && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className={`flex items-center gap-3 mb-2 ${colapsado ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-gray-700 text-xs">{inicial}</div>
          {!colapsado && (
            <div className="text-[11px] overflow-hidden flex-1">
              <p className="font-semibold text-gray-800 truncate" title={userProfile?.nombreCompleto}>{userProfile?.nombreCompleto || 'Mi sesión'}</p>
              <p className="text-gray-500 truncate" title={userProfile?.email}>{userProfile?.email}</p>
              {/* F3-05: mostrar el rol actual del usuario */}
              <p className="text-gray-400 truncate italic" title={`Rol: ${nombreRol}`}>{nombreRol}</p>
            </div>
          )}
        </div>
        {!colapsado ? (
          <button onClick={onLogout} className="w-full text-left text-xs font-medium text-red-600 hover:text-red-800 pt-1">
            Cerrar sesión
          </button>
        ) : (
          <button onClick={onLogout} className="w-full text-center text-xs text-red-600 hover:text-red-800 pt-1" title="Cerrar sesión" aria-label="Cerrar sesión">
            🚪
          </button>
        )}
      </div>
      <div className="px-2 mb-4">
        <ConnectionIndicator />
      </div>
    </aside>
  )
}