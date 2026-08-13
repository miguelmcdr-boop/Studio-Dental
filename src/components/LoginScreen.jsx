import React, { useState } from 'react'
import {
  crearCredencial,
  verificarPassword,
  estaBloqueado,
  registrarIntentoFallido,
  limpiarIntentosFallidos,
  obtenerPerfil,
  guardarPerfil,
  existePerfil,
  MAX_INTENTOS_FALLIDOS,
  supabaseSignIn,
  supabaseSignUp,
} from '../services/authService'
import { NOMBRES_ROLES, DESCRIPCIONES_ROLES } from '../constants/rbacConstants'
import { obtenerRolPorDefecto } from '../services/rbacService'

export const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [rut, setRut] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [rol, setRol] = useState(obtenerRolPorDefecto()) // F3-05: rol por defecto (RECEPCION)
  const [isFirstTime, setIsFirstTime] = useState(false)

  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    setError('')
    
    // F4-02b FIX: En modo Supabase, NO verificar localStorage (el usuario
    // está en Supabase Auth, no en localStorage). Asumimos que el usuario
    // puede existir y mostramos el formulario de login por defecto.
    const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
    
    if (useSupabase) {
      // En modo Supabase, mostramos login por defecto
      setIsFirstTime(false)
    } else {
      // F2-07c: vía authService (existePerfil), no acceso directo a localStorage
      const yaExiste = existePerfil(value.trim())
      setIsFirstTime(!yaExiste)
    }
  }

  /**
   * F4-02b: handleSubmit dual. Usa Supabase Auth cuando VITE_USE_SUPABASE=true,
   * con fallback al sistema local PBKDF2 cuando está desactivado.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (email.trim() === '' || password === '') return

    const formattedEmail = email.trim().toLowerCase()
    const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'

    // F4-02b: el bloqueo por intentos fallidos solo aplica al sistema local.
    // Supabase Auth maneja rate limiting internamente.
    if (!useSupabase) {
      const estadoBloqueo = estaBloqueado(formattedEmail)
      if (estadoBloqueo.bloqueado) {
        const minutos = Math.ceil(estadoBloqueo.restanteMs / 60000)
        setError(`Demasiados intentos fallidos. Intenta nuevamente en ${minutos} minuto(s).`)
        return
      }
    }

    setCargando(true)
    try {
      // Metadata común para ambos modos (Supabase y Local)
      const metadata = {
        nombreCompleto: nombreCompleto || 'Profesional Dental',
        rut: rut || '',
        especialidad: especialidad || 'Cirujano Dentista',
        rol: rol, // F3-05: incluir el rol seleccionado
      }

      if (useSupabase) {
        // ═══════════════════════════════════════════════════
        // MODO SUPABASE AUTH
        // ═══════════════════════════════════════════════════
        if (isFirstTime) {
          // Registro de nuevo usuario
          const result = await supabaseSignUp(formattedEmail, password, metadata)

          if (!result.success) {
            let mensajeError = result.error || 'Error al registrar usuario'
            if (mensajeError.includes('already registered') || mensajeError.includes('already')) {
              mensajeError = 'Este email ya está registrado. Intenta iniciar sesión.'
              setIsFirstTime(false)
            } else if (mensajeError.includes('Password') || mensajeError.includes('password')) {
              mensajeError = 'La contraseña debe tener al menos 6 caracteres.'
            } else if (mensajeError.includes('Invalid email')) {
              mensajeError = 'El formato del email no es válido.'
            }
            setError(mensajeError)
            return
          }
        } else {
          // Login de usuario existente
          const result = await supabaseSignIn(formattedEmail, password)

          if (!result.success) {
            let mensajeError = result.error || 'Credenciales inválidas'
            if (mensajeError.includes('Invalid login credentials') || mensajeError.includes('Invalid')) {
              mensajeError = 'Email o contraseña incorrectos.'
            } else if (mensajeError.includes('Email not confirmed')) {
              mensajeError = 'Debes confirmar tu email antes de iniciar sesión.'
            }
            setError(mensajeError)
            return
          }

          // F4-02b FIX: guardar userMetadata retornado para usar al construir perfil
          metadata._supabaseUserMetadata = result.userMetadata || {}
        }

        // F4-02b FIX: Usar los user_metadata retornados por supabaseSignIn/SignUp
        // (evita race condition con getUser() después del signIn).
        const userMetadata = metadata._supabaseUserMetadata || {}
        const userProfile = {
          email: formattedEmail,
          nombreCompleto: userMetadata.full_name || metadata.nombreCompleto,
          rut: userMetadata.rut || metadata.rut,
          especialidad: userMetadata.especialidad || metadata.especialidad,
          // F4-02b FIX: El rol viene de user_metadata.role, NO del formulario
          rol: userMetadata.role || metadata.rol,
          supabaseAuth: true, // Marcador para identificar que viene de Supabase
        }
        onLogin(userProfile)
      } else {
        // ═══════════════════════════════════════════════════
        // MODO LOCAL (PBKDF2 + localStorage) - Fallback
        // ═══════════════════════════════════════════════════
        // F2-07c: vía authService (obtenerPerfil), no acceso directo a localStorage
        let userProfile = obtenerPerfil(formattedEmail)

        if (!userProfile) {
          // Perfil nuevo: se crea con una credencial real hasheada.
          const credencial = await crearCredencial(password)
          userProfile = {
            email: formattedEmail,
            nombreCompleto: metadata.nombreCompleto,
            rut: metadata.rut,
            especialidad: metadata.especialidad,
            rol: metadata.rol,
            credencial,
          }
          // F2-07c: vía authService (guardarPerfil)
          guardarPerfil(formattedEmail, userProfile)
          limpiarIntentosFallidos(formattedEmail)
          onLogin(userProfile)
          return
        }

        if (!userProfile.credencial) {
          // Perfil creado antes de esta corrección (F1-01): nunca tuvo una
          // contraseña real verificable. Se establece ahora con la contraseña
          // ingresada, como migración de una sola vez.
          const credencial = await crearCredencial(password)
          userProfile = { ...userProfile, credencial }
          // F2-07c: vía authService (guardarPerfil)
          guardarPerfil(formattedEmail, userProfile)
          limpiarIntentosFallidos(formattedEmail)
          onLogin(userProfile)
          return
        }

        const esValida = await verificarPassword(password, userProfile.credencial)
        if (!esValida) {
          const estado = registrarIntentoFallido(formattedEmail)
          const intentosRestantes = MAX_INTENTOS_FALLIDOS - estado.count
          setError(
            intentosRestantes > 0
              ? `Contraseña incorrecta. Te quedan ${intentosRestantes} intento(s) antes del bloqueo temporal.`
              : 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente.'
          )
          return
        }

        limpiarIntentosFallidos(formattedEmail)
        onLogin(userProfile)
      }
    } catch (err) {
      console.error('Error inesperado en login:', err)
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setCargando(false)
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

              {/* F3-05: Selector de rol para nuevos usuarios */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Rol en el sistema</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800 bg-white"
                >
                  {Object.entries(NOMBRES_ROLES).map(([rolValue, rolNombre]) => (
                    <option key={rolValue} value={rolValue}>
                      {rolNombre}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  {DESCRIPCIONES_ROLES[rol] || 'Selecciona tu rol'}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-black text-white font-medium py-2.5 rounded-lg text-sm hover:bg-gray-800 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Verificando...' : isFirstTime ? 'Guardar datos e Ingresar' : 'Ingresar al sistema'}
          </button>

          {/* F4-02b FIX: En modo Supabase, permitir cambiar entre login y registro */}
          {import.meta.env.VITE_USE_SUPABASE === 'true' && (
            <button
              type="button"
              onClick={() => {
                setIsFirstTime(!isFirstTime)
                setError('')
              }}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700 mt-3 underline"
            >
              {isFirstTime 
                ? '¿Ya tienes cuenta? Iniciar sesión' 
                : '¿Primera vez? Crear cuenta'}
            </button>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
              {error}
            </p>
          )}

          {/* F4-02b: Indicador del modo de autenticación activo */}
          {import.meta.env.VITE_USE_SUPABASE === 'true' && (
            <p className="text-[10px] text-gray-400 text-center mt-2">
              🔒 Autenticación segura con Supabase
            </p>
          )}
        </form>
      </div>
    </div>
  )
}