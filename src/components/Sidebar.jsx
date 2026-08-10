import React, { useState } from 'react'

export const Sidebar = ({ userProfile, activeSection, setActiveSection, onLogout }) => {
  const [colapsado, setColapsado] = useState(false)

  const menuItems = [
    { name: 'Agenda', icon: '📅' },
    { name: 'Dashboard', icon: '🎛️' },
    { name: 'Pacientes', icon: '👥' },
    { name: 'Urgencias y GES', icon: '🚨' },
    { name: 'Esterilización', icon: '🧼' },
    { name: 'Laboratorio', icon: '🧪' },
    { name: 'Prestaciones', icon: '🦷' },
    { name: 'Presupuestos', icon: '📋' },
    { name: 'Pagos', icon: '💳' },
    { name: 'Finanzas', icon: '💰' },
    { name: 'Comunicaciones', icon: '✉️' },
    { name: 'Reportes', icon: '📊' },
    { name: 'Inventario', icon: '📦' },
    { name: 'Configuración', icon: '⚡' },
  ]

  const inicial = userProfile?.nombreCompleto 
    ? userProfile.nombreCompleto.replace('Dr. ', '').replace('Dra. ', '').charAt(0).toUpperCase() 
    : 'D'

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
          >
            {colapsado ? '▶' : '◀'}
          </button>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveSection(item.name)}
              title={colapsado ? item.name : ''}
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
            <div className="text-[11px] overflow-hidden">
              <p className="font-semibold text-gray-800 truncate" title={userProfile?.nombreCompleto}>{userProfile?.nombreCompleto || 'Mi sesión'}</p>
              <p className="text-gray-500 truncate" title={userProfile?.email}>{userProfile?.email}</p>
            </div>
          )}
        </div>
        {!colapsado ? (
          <button onClick={onLogout} className="w-full text-left text-xs font-medium text-red-600 hover:text-red-800 pt-1">
            Cerrar sesión
          </button>
        ) : (
          <button onClick={onLogout} className="w-full text-center text-xs text-red-600 hover:text-red-800 pt-1" title="Cerrar sesión">
            🚪
          </button>
        )}
      </div>
    </aside>
  )
}