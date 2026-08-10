import React, { useState, useEffect, Suspense, lazy } from 'react'
import { eliminarTodosPorPaciente as eliminarAdjuntosDelPaciente } from './services/adjuntosStorageService'
import { LoginScreen } from './components/LoginScreen'
import { Sidebar } from './components/Sidebar'
import { CargandoModulo } from './components/CargandoModulo'
import { usePacientesStore } from './store/pacientesStore'
import { usePrestacionesStore } from './store/prestacionesStore'
import { useSesionStore } from './store/sesionStore'
import { odontogramaStorageService } from './modules/odontograma'
import { presupuestosStorageService } from './modules/presupuestos'
import { pagosStorageService } from './modules/pagos'
import { pacientesStorageService } from './modules/pacientes'

// Módulos de uso diario — carga eager (Public API, Constitución v3.0.0)
import { Agenda as AgendaModulo } from './modules/agenda'
import { FichaPaciente, DirectorioPacientes } from './modules/pacientes'
import { DashboardModulo } from './modules/dashboard'

// (F2-05) — resto de los módulos vía React.lazy: no se descargan en el
// bundle inicial, solo cuando el usuario navega a esa sección por primera vez.
const FinanzasModulo = lazy(() => import('./modules/finanzas').then(m => ({ default: m.FinanzasModulo })))
const InventarioModulo = lazy(() => import('./modules/inventario').then(m => ({ default: m.InventarioModulo })))
const UrgenciasGesModulo = lazy(() => import('./modules/urgenciasGes').then(m => ({ default: m.UrgenciasGesModulo })))
const EsterilizacionModulo = lazy(() => import('./modules/esterilizacion').then(m => ({ default: m.EsterilizacionModulo })))
const LaboratorioModulo = lazy(() => import('./modules/laboratorio').then(m => ({ default: m.LaboratorioModulo })))
const PrestacionesModulo = lazy(() => import('./modules/prestaciones').then(m => ({ default: m.PrestacionesModulo })))
const PresupuestosModulo = lazy(() => import('./modules/presupuestos').then(m => ({ default: m.PresupuestosModulo })))
const PagosModulo = lazy(() => import('./modules/pagos').then(m => ({ default: m.PagosModulo })))
const ComunicacionesModulo = lazy(() => import('./modules/comunicaciones').then(m => ({ default: m.ComunicacionesModulo })))
const ReportesModulo = lazy(() => import('./modules/reportes').then(m => ({ default: m.ReportesModulo })))
const ConfiguracionModulo = lazy(() => import('./modules/configuracion').then(m => ({ default: m.ConfiguracionModulo })))

function App() {
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)

  const userProfile = useSesionStore((state) => state.userProfile)
  const loginStore = useSesionStore((state) => state.login)
  const logoutStore = useSesionStore((state) => state.logout)

  useEffect(() => {
    const refrescarDesdeStorage = usePrestacionesStore.getState().refrescarDesdeStorage

    window.addEventListener('storage', refrescarDesdeStorage)
    window.addEventListener('arancel_actualizado', refrescarDesdeStorage)

    return () => {
      window.removeEventListener('storage', refrescarDesdeStorage)
      window.removeEventListener('arancel_actualizado', refrescarDesdeStorage)
    }
  }, [])

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

      // F2-07d: eliminación vía servicios, no acceso directo a localStorage
      odontogramaStorageService.eliminarOdontogramasDePaciente(idPaciente)
      pacientesStorageService.eliminarEvolucionesDePaciente(idPaciente)
      presupuestosStorageService.eliminarItemsDePaciente(idPaciente)
      pagosStorageService.eliminarAbonosDePaciente(idPaciente)
      pacientesStorageService.eliminarRecetasDePaciente(idPaciente)

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
        <Suspense fallback={<CargandoModulo />}>
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
        </Suspense>
      </main>
    </div>
  )
}

export default App