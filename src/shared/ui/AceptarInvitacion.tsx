import React, { useState } from 'react'
import { XCircle, CheckCircle2, Loader2, Mail, Award, ArrowRight } from 'lucide-react'
import { useAceptarInvitacion } from '../hooks/useAceptarInvitacion'
import { PerfilProfesionalPremium, type PerfilProfesionalData } from './PerfilProfesionalPremium'
import { guardarPerfil } from '../../infrastructure/auth/authService'

export interface AceptarInvitacionProps {
  onAceptarExitoso?: () => void
}

export const AceptarInvitacion: React.FC<AceptarInvitacionProps> = ({ onAceptarExitoso }) => {
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const params = new URLSearchParams(hash.split('?')[1] || '')
  const token = params.get('token')

  const [mostrarPerfilDentista, setMostrarPerfilDentista] = useState<boolean>(false)

  const {
    estado,
    error,
    exito,
    email,
    setEmail,
    password,
    setPassword,
    nombreCompleto,
    setNombreCompleto,
    modoRegistro,
    procesando,
    handleSubmitAuth,
    toggleModo,
  } = useAceptarInvitacion(token || '', () => {
    // Si la persona fue invitada o registrada, ofrecer completar su perfil profesional
    setMostrarPerfilDentista(true)
  })

  const handlePerfilCompletado = (datos: PerfilProfesionalData) => {
    if (email) {
      guardarPerfil(email, {
        nombreCompleto: nombreCompleto || email,
        email,
        ...datos,
      })
    }
    if (onAceptarExitoso) onAceptarExitoso()
  }

  const handleSaltarPerfil = () => {
    if (onAceptarExitoso) onAceptarExitoso()
  }

  if (mostrarPerfilDentista) {
    return (
      <PerfilProfesionalPremium
        userProfile={{ email, nombreCompleto }}
        alCompletar={handlePerfilCompletado}
        alSaltar={handleSaltarPerfil}
      />
    )
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-graphite-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-graphite-800 rounded-2xl shadow-xl p-8 text-center space-y-4">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-graphite-50">¡Invitación Aceptada!</h1>
          <p className="text-gray-600 dark:text-graphite-400 text-sm">{exito}</p>
          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={() => setMostrarPerfilDentista(true)}
              className="w-full py-2.5 px-4 bg-[#D4AF37] text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-[#E5C378] transition"
            >
              <Award size={15} />
              <span>Configurar Perfil Profesional Quirúrgico</span>
            </button>
            <button
              type="button"
              onClick={handleSaltarPerfil}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white"
            >
              <span>Ir directamente a la aplicación</span> <ArrowRight size={12} className="inline ml-1" />
            </button>
          </div>
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-graphite-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-graphite-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <Mail size={56} className="mx-auto mb-3 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-graphite-50 mb-1">Aceptar Invitación</h1>
          <p className="text-xs text-gray-600 dark:text-graphite-400">
            Has sido invitado a unirte a una clínica. {modoRegistro ? 'Crea tu cuenta' : 'Inicia sesión'} para aceptar.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitAuth} className="space-y-4">
          {modoRegistro && (
            <div>
              <label htmlFor="nombre" className="block text-xs font-medium text-gray-700 dark:text-graphite-300 mb-1">Nombre Completo</label>
              <input
                type="text"
                id="nombre"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-graphite-600 rounded-xl"
                disabled={procesando}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-graphite-300 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-graphite-600 rounded-xl"
              disabled={procesando}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-graphite-300 mb-1">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-graphite-600 rounded-xl"
              disabled={procesando}
            />
          </div>

          <button
            type="submit"
            disabled={procesando || !email || !password}
            className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {procesando ? 'Procesando...' : (modoRegistro ? 'Crear Cuenta y Aceptar' : 'Iniciar Sesión y Aceptar')}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button onClick={toggleModo} className="text-xs text-blue-600 hover:underline">
            {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}

AceptarInvitacion.displayName = 'AceptarInvitacion'
