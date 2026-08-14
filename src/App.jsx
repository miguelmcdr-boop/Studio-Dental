import React, { useState, useEffect, Suspense, lazy } from 'react'
import { eliminarTodosPorPaciente as eliminarAdjuntosDelPaciente } from './services/adjuntosStorageService'
import { LoginScreen } from './components/LoginScreen'
import { Sidebar } from './components/Sidebar'
import { CargandoModulo } from './components/CargandoModulo'
import { ToastContainer } from './components/ToastContainer'
import { usePacientesStore } from './store/pacientesStore'
import { usePrestacionesStore } from './store/prestacionesStore'
import { useSesionStore } from './store/sesionStore'
import { useDataMigration } from './hooks/useDataMigration'
import { useRealtimeSync } from './hooks/useRealtimeSync'
import { useOfflineQueue } from './hooks/useOfflineQueue'
import { supabase, USE_SUPABASE } from './services/supabaseClient'
import { odontogramaStorageService } from './modules/odontograma'
import { presupuestosStorageService } from './modules/presupuestos/services/presupuestosStorageService'
import { pagosStorageService } from './modules/pagos/services/pagosStorageService'
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
  // F4-02e: Persistir activeSection en localStorage para mantener
  // la navegación entre recargas. Si no hay valor guardado, usar 'Dashboard'.
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const guardado = localStorage.getItem('clinica_active_section')
      return guardado || 'Dashboard'
    } catch {
      return 'Dashboard'
    }
  })
  // F4-02e: Estado del paciente seleccionado. Inicia en null;
  // se restaura desde Supabase si hay ID persistido en localStorage.
  const [pacienteSeleccionado, setPacienteSeleccionadoState] = useState(null)

  // F4-02e: Wrapper que persiste el pacienteId al seleccionar
  const setPacienteSeleccionado = (paciente) => {
    setPacienteSeleccionadoState(paciente)
    try {
      if (paciente?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paciente.id)) {
        localStorage.setItem('clinica_paciente_seleccionado_id', paciente.id)
      } else {
        localStorage.removeItem('clinica_paciente_seleccionado_id')
      }
    } catch (e) {
      console.error('[App] Error al persistir pacienteId:', e)
    }
  }

  // F4-02e: Persistir activeSection cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem('clinica_active_section', activeSection)
    } catch (e) {
      console.error('[App] Error al persistir sección activa:', e)
    }
  }, [activeSection])

  const userProfile = useSesionStore((state) => state.userProfile)
  const loginStore = useSesionStore((state) => state.login)
  const logoutStore = useSesionStore((state) => state.logout)

  // F4-02c-2: ejecutar migración automática de datos al primer login con Supabase


  // F4-02e: Restaurar paciente seleccionado desde Supabase al recargar
  // Esto mantiene la ficha del paciente abierta después de F5.
  useEffect(() => {
    // Solo ejecutar si el usuario está autenticado y aún no hay paciente cargado
    if (!userProfile || !USE_SUPABASE || !supabase || pacienteSeleccionado !== null) {
      return
    }

    const restaurarPacienteSeleccionado = async () => {
      try {
        const pacienteIdGuardado = localStorage.getItem('clinica_paciente_seleccionado_id')
        if (!pacienteIdGuardado) return

        // Validar que sea UUID válido
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pacienteIdGuardado)) {
          localStorage.removeItem('clinica_paciente_seleccionado_id')
          return
        }

        console.log('[App] Restaurando ficha de paciente desde Supabase:', pacienteIdGuardado)

        const { data, error } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', pacienteIdGuardado)
          .maybeSingle()

        if (error) {
          console.error('[App] Error al restaurar paciente:', error.message)
          return
        }

        if (!data) {
          // El paciente fue eliminado en otro dispositivo — limpiar selección
          console.warn('[App] Paciente no encontrado (pudo ser eliminado), limpiando selección')
          localStorage.removeItem('clinica_paciente_seleccionado_id')
          return
        }

        // Transformar de snake_case a camelCase
        const pacienteRestaurado = {
          id: data.id,
          rut: data.rut,
          nombre: data.nombre,
          edad: data.edad,
          telefono: data.telefono,
          email: data.email,
          ocupacion: data.ocupacion,
          prevision: data.prevision,
          alergias: data.alergias,
          fechaNacimiento: data.fecha_nacimiento,
          direccion: data.direccion,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }

        // Asegurar que estamos en la sección correcta
        setPacienteSeleccionadoState(pacienteRestaurado)
        setActiveSection('Pacientes')
        console.log('[App] ✅ Ficha de paciente restaurada:', pacienteRestaurado.nombre)
      } catch (e) {
        console.error('[App] Error inesperado al restaurar paciente:', e)
      }
    }

    restaurarPacienteSeleccionado()
  }, [userProfile, pacienteSeleccionado])
  useDataMigration(userProfile)

  // F5-02: activar sincronización en tiempo real
  useRealtimeSync()

  // F5-03: procesar cola offline al iniciar y al volver la conexión
  useOfflineQueue()


  useEffect(() => {
    const refrescarDesdeStorage = usePrestacionesStore.getState().refrescarDesdeStorage

    window.addEventListener('storage', refrescarDesdeStorage)
    window.addEventListener('arancel_actualizado', refrescarDesdeStorage)

    return () => {
      window.removeEventListener('storage', refrescarDesdeStorage)
      window.removeEventListener('arancel_actualizado', refrescarDesdeStorage)
    }
  }, [])

  // F4-02b FIX: Detectar sesión de Supabase al cargar la app.
  // Si hay una sesión activa pero userProfile está vacío (caso de recarga
  // en incógnito), restaurar el perfil desde Supabase Auth.
  // IMPORTANTE: solo restaurar si NO hay un logout en progreso.
  useEffect(() => {
    if (!USE_SUPABASE || !supabase) return

    // Si userProfile acaba de ser limpiado (logout), no restaurar
    // Esto previene que el useEffect restaure la sesión inmediatamente
    // después de un logout intencional.
    if (userProfile === null) {
      // Esperar un tick para ver si el logout completó el cierre de Supabase
      const timer = setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          // Solo restaurar si Supabase TODAVÍA tiene sesión activa
          // (si el usuario cerró sesión manualmente, session será null)
          if (session?.user) {
            console.log('[App] Sesión de Supabase detectada, restaurando perfil...')
            
            const userMetadata = session.user.user_metadata || {}
            const perfilRestaurado = {
              email: session.user.email,
              nombreCompleto: userMetadata.full_name || session.user.email.split('@')[0],
              rut: userMetadata.rut || '',
              especialidad: userMetadata.especialidad || '',
              rol: userMetadata.role || 'recepcion',
              supabaseAuth: true
            }
            
            loginStore(perfilRestaurado)
          }
        } catch (error) {
          console.error('[App] Error restaurando sesión de Supabase:', error)
        }
      }, 100) // 100ms delay para dar tiempo al logout de cerrar Supabase
      
      return () => clearTimeout(timer)
    }
  }, [userProfile, loginStore])

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
    <>
      <ToastContainer />
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
    </>
  )
}

export default App