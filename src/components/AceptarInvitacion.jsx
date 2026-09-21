import React from 'react'
import { XCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useAceptarInvitacion } from '../hooks/useAceptarInvitacion'

/**
 * F7-11: Pantalla para aceptar invitaciones de miembros.
 * Componente puramente presentacional — toda la lógica está en useAceptarInvitacion.
 */
export const AceptarInvitacion = ({ onAceptarExitoso }) => {
  // Extraer token de URL hash (antes del hook para evitar llamada condicional)
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const params = new URLSearchParams(hash.split('?')[1] || '')
  const token = params.get('token')

  // Hook debe llamarse incondicionalmente (React Hooks rules)
  const {
    estado, error, exito,
    email, setEmail, password, setPassword, nombreCompleto, setNombreCompleto,
    modoRegistro, procesando, handleSubmitAuth, toggleModo
  } = useAceptarInvitacion(token, onAceptarExitoso)

  // Early return DESPUÉS del hook si no hay token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-graphite-800">
        <div className="max-w-md w-full bg-white dark:bg-graphite-800 rounded-lg shadow-lg p-8 text-center">
          <XCircle size={64} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-graphite-50 mb-2">Error</h1>
          <p className="text-red-600 mb-4">Token de invitación no encontrado en la URL</p>
          <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  if (estado === 'exito') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-graphite-800">
        <div className="max-w-md w-full bg-white dark:bg-graphite-800 rounded-lg shadow-lg p-8 text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-graphite-50 mb-2">¡Invitación Aceptada!</h1>
          <p className="text-gray-600 dark:text-graphite-400 mb-4">{exito}</p>
          <p className="text-sm text-gray-500 dark:text-graphite-400">Redirigiendo a la aplicación...</p>
        </div>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-graphite-800">
        <div className="max-w-md w-full bg-white dark:bg-graphite-800 rounded-lg shadow-lg p-8 text-center">
          <XCircle size={64} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-graphite-50 mb-2">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  if (estado === 'aceptando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-graphite-800">
        <div className="text-center">
          <Loader2 size={64} className="animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-graphite-400">Aceptando invitación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-graphite-800">
      <div className="max-w-md w-full bg-white dark:bg-graphite-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Mail size={64} className="mx-auto mb-4 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-graphite-50 mb-2">Aceptar Invitación</h1>
          <p className="text-gray-600 dark:text-graphite-400">
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
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-graphite-300 mb-1">Nombre Completo</label>
              <input type="text" id="nombre" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 dark:border-graphite-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={procesando} />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-graphite-300 mb-1">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 dark:border-graphite-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={procesando} />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-graphite-300 mb-1">Contraseña</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-graphite-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={procesando} />
          </div>

          <button type="submit" disabled={procesando || !email || !password}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {procesando ? 'Procesando...' : (modoRegistro ? 'Crear Cuenta y Aceptar' : 'Iniciar Sesión y Aceptar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={toggleModo} className="text-sm text-blue-600 hover:text-blue-800">
            {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}
