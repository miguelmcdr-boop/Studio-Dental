import React, { useState } from 'react'
import {
  obtenerPerfil,
  guardarPerfil,
  supabaseSignIn,
  supabaseSignUp,
} from '../services/authService'
import { construirUserProfile } from '../services/userProfileBuilder'
import { createLogger } from '../services/logger.js'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { DentikOSLogo } from './brand/DentikOSLogo'
import { Lock } from 'lucide-react'

const log = createLogger('LoginScreen')

export const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [rut, setRut] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [isFirstTime, setIsFirstTime] = useState(false)

  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    setError('')
    // F7-28: no resetear isFirstTime — permite alternar manualmente entre
    // login y alta self-service de dueño/a de clínica (F7-11b).
  }

  /**
   * F7-16: handleSubmit con Supabase Auth únicamente.
   * Modo local PBKDF2 eliminado (código legacy no usado en producción).
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (email.trim() === '' || password === '') return

    const formattedEmail = email.trim().toLowerCase()

    setCargando(true)
    try {
      // F3-05 FIX: el formulario de alta es SOLO para dueños/a de clínica.
      // El rol no se elige aquí: el servidor lo fija a 'recepcion' (handle_new_user)
      // y el wizard de bootstrap lo asciende a 'administrador' al crear la
      // clínica. El resto del equipo entra por invitación (F7-11).
      const metadata = {
        nombreCompleto: nombreCompleto || 'Profesional Dental',
        rut: rut || '',
        especialidad: especialidad || 'Cirujano Dentista',
      }

      // F7-28 FIX: useSupabase eliminado (legacy de F7-16).
      // Solo existe flujo Supabase Auth (no hay modo local).
      if (isFirstTime) {
        // F7-11b: alta self-service del DUEÑO de clínica. Crea la cuenta en
        // Supabase Auth con confirmación de email obligatoria (P0-1). Si aún
        // no confirma, se lo indicamos; al confirmar e iniciar sesión, el
        // wizard de bootstrap le pedirá crear su clínica (rate limit 1/24h
        // y sin rol privilegiado hasta entonces).
        const result = await supabaseSignUp(formattedEmail, password, {
          ...metadata,
          bootstrapClinica: true,
        })

        if (!result.success) {
          if (result.requiresEmailConfirmation) {
            setError('Cuenta creada. Revisa tu correo y confirma tu email, luego inicia sesión desde aquí.')
          } else {
            setError(result.error || 'No se pudo crear la cuenta. Es posible que el email ya esté registrado; intenta iniciar sesión.')
          }
          return
        }

        metadata._supabaseUserMetadata = result.userMetadata || {}
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
      const userProfile = await construirUserProfile(formattedEmail, userMetadata, metadata)
      onLogin(userProfile)
    } catch (err) {
      log.error('Error inesperado en login:', err)
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] bg-blueprint-scanner flex items-center justify-center p-4 print:hidden" role="main" aria-label="Pantalla de autenticación">
      <div className="bg-[#0B132B]/90 dark:bg-graphite-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-[#24334A] w-full max-w-md">
        <div className="flex justify-center mb-6">
          <DentikOSLogo variant="stacked" size="lg" opticalSize="display" dark={true} />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
          {isFirstTime ? 'Crea tu clínica' : 'Iniciar sesión'}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {isFirstTime
            ? 'Solo para dueños o dentistas independientes. Tu equipo se une mediante invitación del administrador.'
            : 'Ingresa tus credenciales para acceder a tu consulta.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico"
            id="login-email"
            data-testid="login-email"
            type="email"
            required
            value={email}
            onChange={handleEmailChange}
            placeholder="dr.miguel@ejemplo.com"
          />

          <Input
            label="Contraseña"
            id="login-password"
            data-testid="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {isFirstTime && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-graphite-800">
              <div>
                <label htmlFor="login-nombre" className="block text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  id="login-nombre"
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Dr. Miguel Díaz Rodríguez"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-graphite-600 focus:outline-none focus:border-black text-sm text-gray-800 dark:text-graphite-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="login-rut" className="block text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase mb-1">RUT / Licencia</label>
                  <input
                    type="text"
                    value={rut}
                    id="login-rut"
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-graphite-600 focus:outline-none focus:border-black text-sm text-gray-800 dark:text-graphite-100"
                  />
                </div>
                <div>
                  <label htmlFor="login-especialidad" className="block text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase mb-1">Especialidad</label>
                  <input
                    type="text"
                    value={especialidad}
                    id="login-especialidad"
                    onChange={(e) => setEspecialidad(e.target.value)}
                    placeholder="Cirujano Dentista"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-graphite-600 focus:outline-none focus:border-black text-sm text-gray-800 dark:text-graphite-100"
                  />
                </div>
              </div>
            </div>
          )}

          <Button data-testid="login-submit" type="submit" loading={cargando} fullWidth className="mt-2">
            {cargando ? 'Verificando...' : isFirstTime ? 'Crear mi cuenta' : 'Ingresar al sistema'}
          </Button>

          {/* F7-11b: dueños de clínica pueden crear su cuenta self-service
              (con confirmación de email obligatoria). El resto del equipo
              entra por invitación (F7-11) — no puede registrarse aquí. */}
          <button
            type="button"
            data-testid="login-toggle-primeriza"
            onClick={() => { setIsFirstTime((v) => !v); setError('') }}
            className="w-full text-[11px] text-slate-400 dark:text-graphite-500 hover:text-white mt-3 text-center"
          >
            {isFirstTime
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿Eres dueño/a o dentista independiente? Crea tu clínica — ¿Trabajas en una clínica? Pide a tu administrador una invitación'}
          </button>

          {error && (
            <p
              data-testid="login-error"
              role="alert"
              aria-live="assertive"
              className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2"
            >
              {error}
            </p>
          )}

          {/* F4-02b: Indicador del modo de autenticación activo */}
          {import.meta.env.VITE_USE_SUPABASE === 'true' && (
            <p className="text-[10px] text-gray-400 dark:text-graphite-500 text-center mt-2">
              <span className="inline-flex items-center gap-1"><Lock size={12} />Autenticación segura con Supabase</span>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}