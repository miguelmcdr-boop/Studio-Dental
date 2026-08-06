import React, { useState, useEffect } from 'react'

// Importación de Módulos Desacoplados bajo Constitución v3.0.0 (Public API)
import { Agenda as AgendaModulo } from './modules/agenda'
import { FichaPaciente } from './modules/pacientes'
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

// Pantalla de Login
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [rut, setRut] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [isFirstTime, setIsFirstTime] = useState(false)

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    const existingProfile = localStorage.getItem(`profile_${value.trim().toLowerCase()}`)
    setIsFirstTime(!existingProfile)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email.trim() !== '') {
      const formattedEmail = email.trim().toLowerCase()
      let userProfile = JSON.parse(localStorage.getItem(`profile_${formattedEmail}`))
      if (!userProfile) {
        userProfile = {
          email: formattedEmail,
          nombreCompleto: nombreCompleto || 'Profesional Dental',
          rut: rut || '',
          especialidad: especialidad || 'Cirujano Dentista',
        }
        localStorage.setItem(`profile_${formattedEmail}`, JSON.stringify(userProfile))
      }
      onLogin(userProfile)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">C</div>
          <h1 className="text-xl font-bold text-gray-800">Consulta</h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {isFirstTime ? 'Crear perfil profesional' : 'Iniciar sesión'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isFirstTime ? 'Ingresa tus datos para personalizar tu clínica.' : 'Ingresa tus credenciales para acceder a tu consulta.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={handleEmailChange}
              placeholder="dr.miguel@ejemplo.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800"
            />
          </div>

          {isFirstTime && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Dr. Miguel Díaz Rodríguez"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">RUT / Licencia</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Especialidad</label>
                  <input
                    type="text"
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    placeholder="Cirujano Dentista"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white font-medium py-2.5 rounded-lg text-sm hover:bg-gray-800 transition-colors mt-2"
          >
            {isFirstTime ? 'Guardar datos e Ingresar' : 'Ingresar al sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}

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
  const [userProfile, setUserProfile] = useState(null)
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [busqueda, setBusqueda] = useState('')
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)

  // 💡 LECTURA NORMALIZADA Y SINCRONIZADA DE ARANCEL Y PACKS
  const [prestacionesArancel, setPrestacionesArancel] = useState(() => {
    const saved = localStorage.getItem('clinica_arancel_prestaciones')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            ...p,
            precio: parseFloat(p.precio ?? p.precioParticular) || 0,
            precioParticular: parseFloat(p.precioParticular ?? p.precio) || 0
          }))
        }
      } catch (e) {
        console.error('Error al leer arancel:', e)
      }
    }
    return [
      { id: 1, nombre: 'Evaluación Clínica y Diagnóstico Integral', especialidad: 'Diagnóstico y Prevención', precio: 25000, precioParticular: 25000, precioFonasa: 15000, codigoFonasa: '01-01-001' },
      { id: 2, nombre: 'Limpieza Dental UDA + Destartraje Ultrasonido', especialidad: 'Diagnóstico y Prevención', precio: 35000, precioParticular: 35000, precioFonasa: 22000, codigoFonasa: '01-01-005' },
      { id: 3, nombre: 'Obturación Resina Simple (1 Cara)', especialidad: 'Operatoria / Estética', precio: 35000, precioParticular: 35000, precioFonasa: 28000, codigoFonasa: '01-02-010' },
      { id: 4, nombre: 'Obturación Resina Compuesta (2-3 Caras)', especialidad: 'Operatoria / Estética', precio: 45000, precioParticular: 45000, precioFonasa: 36000, codigoFonasa: '01-02-012' },
      { id: 5, nombre: 'Incrustación Estética Cerámica / Composite', especialidad: 'Operatoria / Estética', precio: 120000, precioParticular: 120000, precioFonasa: 95000, codigoFonasa: '01-02-025' },
      { id: 6, nombre: 'Tratamiento de Endodoncia Unirradicular', especialidad: 'Endodoncia', precio: 110000, precioParticular: 110000, precioFonasa: 85000, codigoFonasa: '01-03-001' },
      { id: 7, nombre: 'Tratamiento de Endodoncia Multirradicular', especialidad: 'Endodoncia', precio: 160000, precioParticular: 160000, precioFonasa: 130000, codigoFonasa: '01-03-003' },
      { id: 8, nombre: 'Exodoncia Pieza Permanente Simple', especialidad: 'Cirugía Bucal y Maxilofacial', precio: 40000, precioParticular: 40000, precioFonasa: 30000, codigoFonasa: '01-04-001' },
      { id: 9, nombre: 'Corona de Zirconio Monolítico / E-Max', especialidad: 'Rehabilitación y Prótesis', precio: 280000, precioParticular: 280000, precioFonasa: 240000, codigoFonasa: '01-05-015' },
      { id: 10, nombre: 'Instalación de Implante Óseo-Integrado', especialidad: 'Implantología', precio: 480000, precioParticular: 480000, precioFonasa: 420000, codigoFonasa: '01-06-001' }
    ]
  })

  // 💡 Listener en App.jsx para refrescar las props globales cuando cambie localStorage
  useEffect(() => {
    const handleArancelGlobalSync = () => {
      const saved = localStorage.getItem('clinica_arancel_prestaciones')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setPrestacionesArancel(parsed.map(p => ({
              ...p,
              precio: parseFloat(p.precio ?? p.precioParticular) || 0,
              precioParticular: parseFloat(p.precioParticular ?? p.precio) || 0
            })))
          }
        } catch (e) {
          console.error(e)
        }
      }
    }

    window.addEventListener('storage', handleArancelGlobalSync)
    window.addEventListener('arancel_actualizado', handleArancelGlobalSync)

    return () => {
      window.removeEventListener('storage', handleArancelGlobalSync)
      window.removeEventListener('arancel_actualizado', handleArancelGlobalSync)
    }
  }, [])

  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre: '', rut: '', telefono: '', edad: '', prevision: 'Fonasa', alergias: '', email: '', direccion: '', ocupacion: '', contactoEmergencia: ''
  })

  const [pacientes, setPacientes] = useState(() => {
    const saved = localStorage.getItem('clinica_lista_pacientes')
    if (saved) return JSON.parse(saved)
    return [
      { id: 1, nombre: 'Camila Silva Morales', rut: '18.452.123-K', telefono: '+56 9 8765 4321', edad: 28, prevision: 'Isapre', alergias: 'Penicilina', email: 'camila.silva@gmail.com', ocupacion: 'Diseñadora' },
      { id: 2, nombre: 'Carlos Mendoza Vera', rut: '15.321.987-4', telefono: '+56 9 1234 5678', edad: 42, prevision: 'Fonasa', alergias: 'Ninguna', email: 'carlos.mendoza@gmail.com', ocupacion: 'Ingeniero' }
    ]
  })

  useEffect(() => {
    localStorage.setItem('clinica_arancel_prestaciones', JSON.stringify(prestacionesArancel))
  }, [prestacionesArancel])

  useEffect(() => {
    localStorage.setItem('clinica_lista_pacientes', JSON.stringify(pacientes))
  }, [pacientes])

  useEffect(() => {
    const activeEmail = localStorage.getItem('clinica_active_user')
    if (activeEmail) {
      const savedProfile = localStorage.getItem(`profile_${activeEmail}`)
      if (savedProfile) setUserProfile(JSON.parse(savedProfile))
    }
  }, [])

  useEffect(() => {
    if (userProfile?.nombreCompleto) document.title = `Consulta — ${userProfile.nombreCompleto}`
    else document.title = 'Consulta'
  }, [userProfile])

  const handleLogin = (profile) => {
    localStorage.setItem('clinica_active_user', profile.email)
    setUserProfile(profile)
  }

  const handleLogout = () => {
    localStorage.removeItem('clinica_active_user')
    setUserProfile(null)
  }

  const handleCrearPaciente = (e) => {
    e.preventDefault()
    if (!nuevoPaciente.nombre || !nuevoPaciente.rut) return

    const nuevo = {
      ...nuevoPaciente,
      id: Date.now(),
      edad: nuevoPaciente.edad || '30'
    }

    const listaActualizada = [nuevo, ...pacientes]
    setPacientes(listaActualizada)
    setNuevoPaciente({ nombre: '', rut: '', telefono: '', edad: '', prevision: 'Fonasa', alergias: '', email: '', direccion: '', ocupacion: '', contactoEmergencia: '' })
    setMostrarModalNuevo(false)
    setPacienteSeleccionado(nuevo)
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
    }
  }

  if (!userProfile) return <LoginScreen onLogin={handleLogin} />

  const pacientesFiltrados = pacientes.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.rut.includes(busqueda)
  )

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <Sidebar userProfile={userProfile} activeSection={activeSection} setActiveSection={setActiveSection} onLogout={handleLogout} />

      <main className="flex-1 p-8 print:p-0 overflow-x-hidden">
        {activeSection === 'Dashboard' && (
          <DashboardModulo 
            userProfile={userProfile} 
            pacientes={pacientes} 
            setPacienteSeleccionado={setPacienteSeleccionado}
            setActiveSection={setActiveSection} 
          />
        )}

        {activeSection === 'Agenda' && (
          <AgendaModulo 
            pacientes={pacientes} 
            userProfile={userProfile}
            alSeleccionarPaciente={(paciente) => {
              setPacienteSeleccionado(paciente)
              setActiveSection('Pacientes')
            }}
            alCrearPacienteRapido={(nuevoPac) => {
              setPacientes(prev => [nuevoPac, ...prev])
            }}
          />
        )}

        {activeSection === 'Urgencias y GES' && (
          <UrgenciasGesModulo pacientes={pacientes} userProfile={userProfile} />
        )}

        {activeSection === 'Esterilización' && (
          <EsterilizacionModulo userProfile={userProfile} />
        )}

        {activeSection === 'Laboratorio' && (
          <LaboratorioModulo pacientes={pacientes} userProfile={userProfile} />
        )}

        {activeSection === 'Prestaciones' && (
          <PrestacionesModulo prestaciones={prestacionesArancel} setPrestaciones={setPrestacionesArancel} />
        )}

        {activeSection === 'Presupuestos' && (
          <PresupuestosModulo 
            pacientes={pacientes} 
            prestaciones={prestacionesArancel}
            setPacienteSeleccionado={setPacienteSeleccionado} 
            setActiveSection={setActiveSection} 
            userProfile={userProfile}
          />
        )}

        {activeSection === 'Pagos' && (
          <PagosModulo pacientes={pacientes} userProfile={userProfile} />
        )}

        {activeSection === 'Finanzas' && (
          <FinanzasModulo pacientes={pacientes} userProfile={userProfile} />
        )}

        {activeSection === 'Comunicaciones' && (
          <ComunicacionesModulo pacientes={pacientes} userProfile={userProfile} />
        )}

        {activeSection === 'Inventario' && <InventarioModulo />}

        {activeSection === 'Reportes' && (
          <ReportesModulo pacientes={pacientes} userProfile={userProfile} />
        )}

        {activeSection === 'Configuración' && (
          <ConfiguracionModulo userProfile={userProfile} setUserProfile={setUserProfile} pacientes={pacientes} />
        )}

        {activeSection === 'Pacientes' && (
          pacienteSeleccionado ? (
            <FichaPaciente 
              paciente={pacienteSeleccionado} 
              userProfile={userProfile}
              prestacionesArancel={prestacionesArancel}
              alActualizarPaciente={handleActualizarPaciente}
              alEliminarPaciente={handleEliminarPaciente}
              alVolver={() => setPacienteSeleccionado(null)} 
            />
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Directorio de Pacientes</h2>
                  <p className="text-xs text-gray-500">Busca, administra, edita o elimina registros de pacientes.</p>
                </div>
                <button
                  onClick={() => setMostrarModalNuevo(true)}
                  className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span>➕</span> Nuevo Paciente
                </button>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="🔍 Buscar por nombre o RUT del paciente..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pacientesFiltrados.map(p => (
                  <div
                    key={p.id}
                    className="p-5 border border-gray-200 rounded-2xl hover:border-black transition-all bg-gray-50 flex justify-between items-center group"
                  >
                    <div onClick={() => setPacienteSeleccionado(p)} className="cursor-pointer flex-1">
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{p.nombre}</h3>
                      <p className="text-xs text-gray-500">RUT: {p.rut}</p>
                      <p className="text-xs text-gray-500">Tel: {p.telefono || 'Sin teléfono'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPacienteSeleccionado(p)}
                        className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100"
                      >
                        Ficha →
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEliminarPaciente(p.id); }}
                        className="text-xs text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        title="Eliminar paciente"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Modal Crear Paciente */}
        {mostrarModalNuevo && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900">Registrar Nuevo Paciente</h3>
                <button onClick={() => setMostrarModalNuevo(false)} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
              </div>

              <form onSubmit={handleCrearPaciente} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={nuevoPaciente.nombre}
                    onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, nombre: e.target.value })}
                    placeholder="Ej: Juan Pérez González"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-600 uppercase mb-1">RUT *</label>
                    <input
                      type="text"
                      required
                      value={nuevoPaciente.rut}
                      onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, rut: e.target.value })}
                      placeholder="12.345.678-9"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 uppercase mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={nuevoPaciente.telefono}
                      onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, telefono: e.target.value })}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-600 uppercase mb-1">Edad</label>
                    <input
                      type="number"
                      value={nuevoPaciente.edad}
                      onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, edad: e.target.value })}
                      placeholder="30"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 uppercase mb-1">Correo</label>
                    <input
                      type="email"
                      value={nuevoPaciente.email}
                      onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, email: e.target.value })}
                      placeholder="juan@ejemplo.com"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 uppercase mb-1">Previsión</label>
                    <select
                      value={nuevoPaciente.prevision}
                      onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, prevision: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                    >
                      <option value="Fonasa">Fonasa</option>
                      <option value="Isapre">Isapre</option>
                      <option value="Particular">Particular</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-red-600 uppercase mb-1">Alergias Conocidas</label>
                  <input
                    type="text"
                    value={nuevoPaciente.alergias}
                    onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, alergias: e.target.value })}
                    placeholder="Ej: Penicilina, AINEs, Ninguna"
                    className="w-full px-3 py-2 rounded-lg border border-red-200 bg-red-50/30 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalNuevo(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800"
                  >
                    Crear Paciente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App