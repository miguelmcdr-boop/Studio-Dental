import React, { useState, useEffect } from 'react'
import { aceptarInvitacion, supabaseSignIn, supabaseSignUp } from '../services/authService'
import { createLogger } from '../services/logger'

const log = createLogger('AceptarInvitacion')

/**
 * F7-11: Pantalla para aceptar invitaciones de miembros.
 * 
 * Flujo:
 * 1. Usuario recibe link con token: /#/aceptar-invita?token=xxx
 * 2. Si no está autenticado: muestra formulario de login/signup
 * 3. Si está autenticado: acepta la invitación automáticamente
 * 4. Después de aceptar: redirige a la app principal
 * 
 * Valida:
 * - Token existe en URL
 * - Email del usuario autenticado coincide con la invitación
 * - Token no está expirado ni revocado
 */
export const AceptarInvitacion = ({ onAceptarExitoso }) => {
  const [token, setToken] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando | login | aceptando | exito | error
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)
  
  // Formulario de login/signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [modoRegistro, setModoRegistro] = useState(false)
  const [procesando, setProcesando] = useState(false)
  
  // Extraer token de la URL hash al montar
  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.split('?')[1] || '')
    const tokenFromUrl = params.get('token')
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
      setEstado('login')
    } else {
      setEstado('error')
      setError('Token de invitación no encontrado en la URL')
    }
  }, [])
  
  const handleAceptar = async () => {
    setEstado('aceptando')
    setError(null)
    
    try {
      const result = await aceptarInvitacion(token)
      
      if (result.success) {
        setEstado('exito')
        setExito(`¡Has sido agregado a la clínica exitosamente!`)
        
        // Limpiar hash de la URL
        window.history.replaceState(null, '', window.location.pathname)
        
        // Redirigir a la app después de 2 segundos
        setTimeout(() => {
          if (onAceptarExitoso) {
            onAceptarExitoso(result.clinicaId)
          }
        }, 2000)
      } else {
        setEstado('error')
        setError(result.error || 'Error al aceptar la invitación')
      }
    } catch (err) {
      log.error('Error aceptando invitación:', err)
      setEstado('error')
      setError('Error inesperado al aceptar la invitación')
    }
  }
  
  const handleSubmitAuth = async (e) => {
    e.preventDefault()
    setProcesando(true)
    setError(null)
    
    try {
      let result
      
      if (modoRegistro) {
        // Registro
        result = await supabaseSignUp(email, password, {
          nombreCompleto,
          email
        })
      } else {
        // Login
        result = await supabaseSignIn(email, password)
      }
      
      if (result.error) {
        setError(result.error)
      } else {
        // Autenticación exitosa, ahora aceptar invitación
        await handleAceptar()
      }
    } catch (err) {
      log.error('Error en autenticación:', err)
      setError('Error en autenticación: ' + err.message)
    } finally {
      setProcesando(false)
    }
  }
  
  // Estado: Cargando
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-600">Cargando invitación...</div>
      </div>
    )
  }
  
  // Estado: Éxito
  if (estado === 'exito') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Invitación Aceptada!</h1>
            <p className="text-gray-600 mb-4">{exito}</p>
            <p className="text-sm text-gray-500">Redirigiendo a la aplicación...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Estado: Error
  if (estado === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Estado: Login/Signup
  if (estado === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Aceptar Invitación</h1>
            <p className="text-gray-600">
              Has sido invitado a unirte a una clínica. {modoRegistro ? 'Crea tu cuenta' : 'Inicia sesión'} para aceptar.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmitAuth} className="space-y-4">
            {modoRegistro && (
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={procesando}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={procesando}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={procesando}
              />
            </div>
            
            <button
              type="submit"
              disabled={procesando || !email || !password}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {procesando ? 'Procesando...' : (modoRegistro ? 'Crear Cuenta y Aceptar' : 'Iniciar Sesión y Aceptar')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setModoRegistro(!modoRegistro)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Estado: Aceptando (loading)
  if (estado === 'aceptando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Aceptando invitación...</p>
        </div>
      </div>
    )
  }
  
  return null
}
