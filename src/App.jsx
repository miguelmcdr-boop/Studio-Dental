import React, { useState, useEffect } from 'react'
import { eliminarTodosPorPaciente as eliminarAdjuntosDelPaciente } from './services/adjuntosStorageService'
import { LoginScreen } from './components/LoginScreen'
import { usePacientesStore } from './store/pacientesStore'
import { usePrestacionesStore } from './store/prestacionesStore'
import { useSesionStore } from './store/sesionStore'

// Importación de Módulos Desacoplados bajo Constitución v3.0.0 (Public API)
import { Agenda as AgendaModulo } from './modules/agenda'
import { FichaPaciente, DirectorioPacientes } from './modules/pacientes'
import { FinanzasModulo } from './modules/finanzas'
import { InventarioModulo } from './modules/inventario'
import { UrgenciasGesModulo } from './modules/urgenciasGes'
import { EsterilizacionModulo } from './modules/esterilizacion'
import { LaboratorioModulo } from './modules/laboratorio'
import { PrestacionesModulo } from './modules/prestaciones'
import { PresupuestosModulo } from './modules/presupuestos'
import { PagosModulo } from './modules/pagos'
import { ComunicacionesModulo } from './modules/comunicaciones'
import { ReportesModulo } from './modules/reportes'
import { ConfiguracionModulo } from './modules/configuracion'
import { DashboardModulo } from './modules/dashboard'

// Sidebar de Navegación Nivel Superior
const Sidebar = ({ userProfile, activeSection, setActiveSection, onLogout }) => {
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

function App() {
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)

  // (F2-01) — sesión/perfil ya no es un useState local: viene del store global.
  const userProfile = useSesionStore((state) => state.userProfile)
  const loginStore = useSesionStore((state) => state.login)
  const logoutStore = useSesionStore((state) => state.logout)

  // (F2-02) — listener de sincronización cross-módulo del arancel, usando el
  // store directamente (App.jsx ya no lee ni pasa prestacionesArancel a nadie).
  useEffect(() => {
    const refrescarDesdeStorage = usePrestacionesStore.getState().refrescarDesdeStorage

    window.addEventListener('storage', refrescarDesdeStorage)
    window.addEventListener('arancel_actualizado', refrescarDesdeStorage)

    return () => {
      window.removeEventListener('storage', refrescarDesdeStorage)
      window.removeEventListener('arancel_actualizado', refrescarDesdeStorage)
    }
  }, [])

  // (F2-01) — pacientes ya no es un useState local: viene del store global.
  // Se mantiene acá solo para los handlers de actualizar/eliminar, que se
  // pasan como callback a FichaPaciente y a DirectorioPacientes.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const setPacientes = usePacientesStore((state) => state.setPacientes)

  useEffect(() => {
    if (userProfile?.nombreCompleto) document.title = `Consulta — ${userProfile.nombreCompleto}`
    else document.title = 'Consulta'
  }, [userProfile])

  const handleLogin = (profile) => {
    loginStore(profile)
  }

  const handleLogout = () => {
    logoutStore()
  }

  const handleActualizarPaciente = (pacienteActualizado) => {
    const nuevaLista = pacientes.map(p => p.id === pacienteActualizado.id ? pacienteActualizado : p)
    setPacientes(nuevaLista)
    setPacienteSeleccionado(pacienteActualizado)
  }

  const handleEliminarPaciente = (idPaciente) => {
    if (window.confirm('¿Estás seguro de eliminar este paciente y todos sus registros clínicos? Esta acción no se puede deshacer.')) {
      const nuevaLista = pacientes.filter(p => p.id !== idPaciente)
      setPacientes(nuevaLista)
      setPacienteSeleccionado(null)
      localStorage.removeItem(`odonto_inicial_${idPaciente}`)
      localStorage.removeItem(`odonto_evolucion_${idPaciente}`)
      localStorage.removeItem(`evoluciones_notas_${idPaciente}`)
      localStorage.removeItem(`presupuesto_items_${idPaciente}`)
      localStorage.removeItem(`abonos_${idPaciente}`)
      localStorage.removeItem(`recetas_${idPaciente}`)
      // Los adjuntos clínicos viven en IndexedDB (F1-02), no en localStorage.
      // La eliminación es asíncrona; se registra el error si falla, pero no
      // bloquea el resto del flujo de eliminación del paciente.
      eliminarAdjuntosDelPaciente(idPaciente).catch((e) => {
        console.error('No se pudieron eliminar los adjuntos IndexedDB del paciente:', e)
      })
    }
  }

  if (!userProfile) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <Sidebar userProfile={userProfile} activeSection={activeSection} setActiveSection={setActiveSection} onLogout={handleLogout} />

      <main className="flex-1 p-8 print:p-0 overflow-x-hidden">
        {activeSection === 'Dashboard' && (
          <DashboardModulo 
            setPacienteSeleccionado={setPacienteSeleccionado}
            setActiveSection={setActiveSection} 
          />
        )}

        {activeSection === 'Agenda' && (
          <AgendaModulo 
            alSeleccionarPaciente={(paciente) => {
              setPacienteSeleccionado(paciente)
              setActiveSection('Pacientes')
            }}
          />
        )}

        {activeSection === 'Urgencias y GES' && (
          <UrgenciasGesModulo />
        )}

        {activeSection === 'Esterilización' && (
          <EsterilizacionModulo />
        )}

        {activeSection === 'Laboratorio' && (
          <LaboratorioModulo />
        )}

        {activeSection === 'Prestaciones' && (
          <PrestacionesModulo />
        )}

        {activeSection === 'Presupuestos' && (
          <PresupuestosModulo 
            setPacienteSeleccionado={setPacienteSeleccionado} 
            setActiveSection={setActiveSection} 
          />
        )}

        {activeSection === 'Pagos' && (
          <PagosModulo />
        )}

        {activeSection === 'Finanzas' && (
          <FinanzasModulo />
        )}

        {activeSection === 'Comunicaciones' && (
          <ComunicacionesModulo />
        )}

        {activeSection === 'Inventario' && <InventarioModulo />}

        {activeSection === 'Reportes' && (
          <ReportesModulo />
        )}

        {activeSection === 'Configuración' && (
          <ConfiguracionModulo />
        )}

        {activeSection === 'Pacientes' && (
          pacienteSeleccionado ? (
            <FichaPaciente 
              paciente={pacienteSeleccionado} 
              alActualizarPaciente={handleActualizarPaciente}
              alEliminarPaciente={handleEliminarPaciente}
              alVolver={() => setPacienteSeleccionado(null)} 
            />
          ) : (
            <DirectorioPacientes
              alSeleccionarPaciente={setPacienteSeleccionado}
              alEliminarPaciente={handleEliminarPaciente}
              alPacienteCreado={setPacienteSeleccionado}
            />
          )
        )}
      </main>
    </div>
  )
}

export default App