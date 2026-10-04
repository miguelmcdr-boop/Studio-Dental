import React, { useState, useEffect, Suspense, lazy } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { Sidebar } from './components/Sidebar'
import { CargandoModulo } from './components/CargandoModulo'
import { ErrorBoundary } from './components/ErrorBoundary' // F6-01
import { ToastContainer } from './components/ToastContainer'
import { AppDialogProvider } from './components/AppDialogProvider'
import { TopBar } from './components/TopBar'
import { usePacientesStore } from './store/pacientesStore'
import { usePrestacionesStore } from './store/prestacionesStore'
import { useSesionStore } from './store/sesionStore'
import { useDataMigration } from './hooks/useDataMigration'
import { useNavegacionClinica } from './modules/pacientes/hooks/useNavegacionClinica' // F7-26
import { useRealtimeSync } from './hooks/useRealtimeSync'
import { useOfflineQueue } from './hooks/useOfflineQueue'
import { supabase, USE_SUPABASE } from './services/supabaseClient'
import { construirUserProfile } from './services/userProfileBuilder'
import { useBootstrapDetection } from './hooks/useBootstrapDetection'
import { AceptarInvitacion } from './components/AceptarInvitacion'
import { BootstrapClinica } from './components/BootstrapClinica'
import { VerificandoCuenta } from './components/VerificandoCuenta'
import { useInvitacionHash } from './hooks/useInvitacionHash'
import { useDarkMode } from './hooks/useDarkMode'
import { useRestaurarPaciente } from './hooks/useRestaurarPaciente'
import { useSidebarCounters } from './hooks/useSidebarCounters'
import { useCommandPalette } from './hooks/useCommandPalette'
import { CommandPalette } from './components/CommandPalette'

// Módulos de uso diario — carga eager (Public API, Constitución v3.0.0)
import { Agenda as AgendaModulo } from './modules/agenda'
import { FichaPaciente, DirectorioPacientes } from './modules/pacientes'
import { usePacientesActions } from './modules/pacientes/hooks/usePacientesActions'
import { useSessionGuard } from './hooks/useSessionGuard'
import { DashboardModulo } from './modules/dashboard'
import { createLogger } from './services/logger'
import { createTenantRepository } from './services/localStorageRepository' // F7-36 FASE 1 (hotfix import)
import type { Paciente } from './modules/pacientes/schemas/pacienteSchema'
import type { PerfilUsuario } from './services/authService'

const log = createLogger('App')

// (F2-05) — resto de los módulos vía React.lazy: no se descargan en el
// bundle inicial, solo cuando el usuario navega a esa sección por primera vez.
const FinanzasModulo = lazy(() => import('./modules/finanzas').then(m => ({ default: m.FinanzasModulo })))
const InventarioModulo = lazy(() => import('./modules/inventario').then(m => ({ default: m.InventarioModulo })))
const UrgenciasGesModulo = lazy(() => import('./modules/urgenciasGes').then(m => ({ default: m.UrgenciasGesModulo })))
const EsterilizacionModulo = lazy(() => import('./modules/esterilizacion').then(m => ({ default: m.EsterilizacionModulo })))
const LaboratorioModulo = lazy(() => import('./domains/addons/lab').then(m => ({ default: m.LaboratorioModulo })))
const PrestacionesModulo = lazy(() => import('./modules/prestaciones').then(m => ({ default: m.PrestacionesModulo })))
const PresupuestosModulo = lazy(() => import('./modules/presupuestos').then(m => ({ default: m.PresupuestosModulo })))
const PagosModulo = lazy(() => import('./modules/pagos').then(m => ({ default: m.PagosModulo })))
const ComunicacionesModulo = lazy(() => import('./modules/comunicaciones').then(m => ({ default: m.ComunicacionesModulo })))
const ReportesModulo = lazy(() => import('./modules/reportes').then(m => ({ default: m.ReportesModulo })))
const ConfiguracionModulo = lazy(() => import('./modules/configuracion').then(m => ({ default: m.ConfiguracionModulo })))
const AdminVademecumModulo = lazy(() => import('./domains/organization/vademecum').then(m => ({ default: m.AdminVademecumModulo })))
const GestionMiembrosModulo = lazy(() => import('./domains/organization/team').then(m => ({ default: m.GestionMiembrosModulo })))

interface SesionStoreState {
  userProfile: PerfilUsuario | null
  login: (profile: PerfilUsuario) => void
  logout: () => void
}

interface PacientesStoreState {
  pacientes: Paciente[]
  setPacientes: (pacientes: Paciente[]) => void
}

interface DashboardModuloProps {
  setPacienteSeleccionado: (paciente: Paciente | null) => void
  setActiveSection: (seccion: string) => void
}

interface AgendaModuloProps {
  alSeleccionarPaciente: (paciente: Paciente) => void
}

interface PresupuestosModuloProps {
  setPacienteSeleccionado: (paciente: Paciente | null) => void
  setActiveSection: (seccion: string) => void
}

interface FichaPacienteProps {
  paciente: Paciente
  alActualizarPaciente: (paciente: Paciente) => void
  alEliminarPaciente: (idPaciente: string | number) => void
  alVolver: () => void
  navegacionClinica?: unknown
}

interface DirectorioPacientesProps {
  alSeleccionarPaciente: (paciente: Paciente | null) => void
  alEliminarPaciente: (idPaciente: string | number) => void
  alPacienteCreado: (paciente: Paciente) => void
}

const Dashboard = DashboardModulo as React.ComponentType<DashboardModuloProps>
const Agenda = AgendaModulo as React.ComponentType<AgendaModuloProps>
const Presupuestos = PresupuestosModulo as React.ComponentType<PresupuestosModuloProps>
const Ficha = FichaPaciente as React.ComponentType<FichaPacienteProps>
const Directorio = DirectorioPacientes as React.ComponentType<DirectorioPacientesProps>

export const App: React.FC = () => {
  // F7-36 FASE 1 (Commit 1.5f): repo tenant-aware para paciente seleccionado (PHI).
  // La clave clinica_paciente_seleccionado_id ahora se almacena como
  // sd_<clinicaId>_clinica_paciente_seleccionado_id para aislamiento multi-tenant.
  const pacienteSeleccionadoRepo = createTenantRepository<string | null>('clinica_paciente_seleccionado_id', null)

  // F4-02e: Persistir activeSection (localStorage). Si no hay, usar 'Dashboard'.
  const [activeSection, setActiveSection] = useState<string>(() => {
    try {
      const guardado = localStorage.getItem('clinica_active_section')
      return guardado || 'Dashboard'
    } catch {
      return 'Dashboard'
    }
  })
  // F4-02e: Paciente seleccionado (null inicialmente, restaurado desde Supabase).
  const [pacienteSeleccionado, setPacienteSeleccionadoState] = useState<Paciente | null>(null)

  // F4-02e + F7-36: Wrapper que persiste el pacienteId en repo tenant-aware
  const setPacienteSeleccionado = (paciente: Paciente | null): void => {
    setPacienteSeleccionadoState(paciente)
    try {
      if (paciente?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(paciente.id))) {
        // F7-36: usa tenant-aware para aislamiento multi-tenant
        pacienteSeleccionadoRepo.guardar(String(paciente.id))
      } else {
        pacienteSeleccionadoRepo.eliminar()
      }
    } catch (e: unknown) {
      log.error('Error al persistir pacienteId:', e)
    }
  }

  // F4-02e: Persistir activeSection cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem('clinica_active_section', activeSection)
    } catch (e: unknown) {
      log.error('Error al persistir sección activa:', e)
    }
  }, [activeSection])

  const userProfile = useSesionStore((state: unknown) => (state as SesionStoreState).userProfile)
  const loginStore = useSesionStore((state: unknown) => (state as SesionStoreState).login)
  const bootstrapNecesario = useBootstrapDetection(userProfile) // F7-11b
  // F7-11: Detectar invitación pendiente en URL hash
  const invitacionPendiente = useInvitacionHash()

  // F7-25: Dark mode y modo quirúrgico con persistencia
  const { theme, darkMode, cycleTheme, toggleDarkMode } = useDarkMode()
  const logoutStore = useSesionStore((state: unknown) => (state as SesionStoreState).logout)

  // F6-H: Timeout de sesión + sincronización entre pestañas + manejo de errores 401
  useSessionGuard({ userProfile, logout: logoutStore })

  // F4-02e: Restaurar paciente seleccionado desde Supabase al recargar
  useRestaurarPaciente(userProfile, pacienteSeleccionado, setPacienteSeleccionadoState, setActiveSection)
  // F10-B2.5: contadores para el Sidebar
  const sidebarCounters = useSidebarCounters()

  // F7-26: Navegación clínica entre pacientes (← → en ficha)
  const navegacionClinica = useNavegacionClinica(
    pacienteSeleccionado,
    setPacienteSeleccionado
  )

  // F10-B4: CommandPalette con ⌘K (F7-26: + onSelectPaciente)
  const commandPalette = useCommandPalette({
    onNavigate: setActiveSection,
    onCreateCita: () => setActiveSection('Agenda'),
    onCreatePaciente: () => setActiveSection('Pacientes'),
    onCreatePresupuesto: () => setActiveSection('Presupuestos'),
    onSelectPaciente: (paciente: Paciente) => setPacienteSeleccionado(paciente), // F7-26: seleccionar paciente desde CommandPalette
  })

  // F10-B4: Atajo ⌘K / Ctrl+K para abrir CommandPalette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        commandPalette.toggle()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [commandPalette])

  useDataMigration(userProfile)

  // F5-02: activar sincronización en tiempo real
  useRealtimeSync()

  // F5-03: procesar cola offline al iniciar y al volver la conexión
  useOfflineQueue()

  useEffect(() => {
    const refrescarDesdeStorage = (usePrestacionesStore.getState() as { refrescarDesdeStorage: () => void }).refrescarDesdeStorage

    window.addEventListener('storage', refrescarDesdeStorage)
    window.addEventListener('arancel_actualizado', refrescarDesdeStorage)

    return () => {
      window.removeEventListener('storage', refrescarDesdeStorage)
      window.removeEventListener('arancel_actualizado', refrescarDesdeStorage)
    }
  }, [])

  // F4-02b FIX: Detectar sesión de Supabase al cargar la app
  // y restaurar perfil. IMPORTANTE: solo restaurar si NO hay logout en progreso.
  useEffect(() => {
    if (!USE_SUPABASE || !supabase) return

    // Si userProfile acaba de ser limpiado (logout), no restaurar
    // Esto previene que el useEffect restaure la sesión inmediatamente
    // después de un logout intencional.
    if (userProfile === null) {
      // Esperar un tick para ver si el logout completó el cierre de Supabase
      const timer = setTimeout(async () => {
        try {
          if (!supabase) return
          const { data: { session } } = await supabase.auth.getSession()

          // Solo restaurar si Supabase TODAVÍA tiene sesión activa
          // (si el usuario cerró sesión manualmente, session será null)
          if (session?.user) {
            log.info('Sesión de Supabase detectada, restaurando perfil...')

            // F7-10b: reconstruir perfil con rol contextual vía construirUserProfile
            // (lee miembros_clinica.rol filtrado por clinica_actual())
            const userMetadata = { ...(session.user.user_metadata || {}), role: session.user.app_metadata?.role || 'recepcion' }
            const perfilRestaurado = await construirUserProfile(
              session.user.email?.toLowerCase() || '',
              userMetadata,
              {}
            )

            loginStore(perfilRestaurado as unknown as PerfilUsuario)
            log.info('F7-10b: Perfil restaurado con rol contextual:', perfilRestaurado.rol)
          }
        } catch (error: unknown) {
          log.error('Error restaurando sesión de Supabase:', error)
        }
      }, 100) // 100ms delay para dar tiempo al logout de cerrar Supabase

      return () => clearTimeout(timer)
    }
  }, [userProfile, loginStore])

  const pacientes = usePacientesStore((state: unknown) => (state as PacientesStoreState).pacientes)
  const setPacientes = usePacientesStore((state: unknown) => (state as PacientesStoreState).setPacientes)

  useEffect(() => {
    if (userProfile?.nombreCompleto) document.title = `DentikOS — ${userProfile.nombreCompleto}`
    else document.title = 'DentikOS'
  }, [userProfile])

  const handleLogin = (profile: PerfilUsuario): void => {
    loginStore(profile)
  }

  const handleLogout = (): void => {
    logoutStore()
  }

  const handleActualizarPaciente = (pacienteActualizado: Paciente): void => {
    const nuevaLista = pacientes.map(p => p.id === pacienteActualizado.id ? pacienteActualizado : p)
    setPacientes(nuevaLista)
    setPacienteSeleccionado(pacienteActualizado)
  }

  const { handleEliminarPaciente } = usePacientesActions(
    pacientes,
    setPacientes,
    pacienteSeleccionado,
    setPacienteSeleccionado
  )

  // F7-11b: Pantalla de verificación mientras se determina bootstrapNecesario
  if (bootstrapNecesario === null && userProfile) return <VerificandoCuenta />

  if (bootstrapNecesario) return <BootstrapClinica onComplete={() => window.location.reload()} />

  // F7-11: Invitación pendiente
  if (invitacionPendiente) return <AceptarInvitacion onAceptarExitoso={() => window.location.reload()} />

  if (!userProfile) return <LoginScreen onLogin={handleLogin} />

  return (
    <>
      <ToastContainer />
      <AppDialogProvider />
      <CommandPalette {...commandPalette} />
      <div className="min-h-screen flex flex-col bg-canvas text-primary-surface font-sans">
        <TopBar
          userProfile={userProfile}
          onLogout={handleLogout}
          darkMode={darkMode}
          theme={theme}
          onToggleDarkMode={toggleDarkMode}
          onCycleTheme={cycleTheme}
        />
        <div className="flex flex-1">
          <Sidebar userProfile={userProfile} activeSection={activeSection} setActiveSection={setActiveSection} onLogout={handleLogout} counters={sidebarCounters} />

          <main className="flex-1 p-8 print:p-0 overflow-x-hidden">
            <Suspense fallback={<CargandoModulo />}>
              {activeSection === 'Dashboard' && (
                <Dashboard
                  setPacienteSeleccionado={setPacienteSeleccionado}
                  setActiveSection={setActiveSection}
                />
              )}

              {activeSection === 'Agenda' && (
                <ErrorBoundary modulo="agenda" onReset={() => setActiveSection('Dashboard')}>
                  <Agenda
                    alSeleccionarPaciente={(paciente: Paciente) => {
                      setPacienteSeleccionado(paciente)
                      setActiveSection('Pacientes')
                    }}
                  />
                </ErrorBoundary>
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
                <ErrorBoundary modulo="presupuestos" onReset={() => setActiveSection('Dashboard')}>
                  <Presupuestos
                    setPacienteSeleccionado={setPacienteSeleccionado}
                    setActiveSection={setActiveSection}
                  />
                </ErrorBoundary>
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

              {activeSection === 'Miembros' && (
                <GestionMiembrosModulo />
              )}

              {activeSection === 'Vademécum' && <AdminVademecumModulo />}

              {activeSection === 'Configuración' && (
                <ConfiguracionModulo />
              )}

              {activeSection === 'Pacientes' && (
                <ErrorBoundary modulo="pacientes" onReset={() => { setPacienteSeleccionado(null); setActiveSection('Dashboard') }}>
                  {pacienteSeleccionado ? (
                    <Ficha
                      paciente={pacienteSeleccionado}
                      alActualizarPaciente={handleActualizarPaciente}
                      alEliminarPaciente={handleEliminarPaciente}
                      alVolver={() => setPacienteSeleccionado(null)}
                      navegacionClinica={navegacionClinica} /* F7-26 */
                    />
                  ) : (
                    <Directorio
                      alSeleccionarPaciente={setPacienteSeleccionado}
                      alEliminarPaciente={handleEliminarPaciente}
                      alPacienteCreado={setPacienteSeleccionado}
                    />
                  )}
                </ErrorBoundary>
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </>
  )
}

export default App
