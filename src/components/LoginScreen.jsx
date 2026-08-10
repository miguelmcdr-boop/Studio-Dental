import React, { useState } from 'react'
import {
  crearCredencial,
  verificarPassword,
  estaBloqueado,
  registrarIntentoFallido,
  limpiarIntentosFallidos,
  MAX_INTENTOS_FALLIDOS,
} from '../services/authService'

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
    const existingProfile = localStorage.getItem(`profile_${value.trim().toLowerCase()}`)
    setIsFirstTime(!existingProfile)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (email.trim() === '' || password === '') return

    const formattedEmail = email.trim().toLowerCase()

    const estadoBloqueo = estaBloqueado(formattedEmail)
    if (estadoBloqueo.bloqueado) {
      const minutos = Math.ceil(estadoBloqueo.restanteMs / 60000)
      setError(`Demasiados intentos fallidos. Intenta nuevamente en ${minutos} minuto(s).`)
      return
    }

    setCargando(true)
    try {
      let userProfile = JSON.parse(localStorage.getItem(`profile_${formattedEmail}`) || 'null')

      if (!userProfile) {
        // Perfil nuevo: se crea con una credencial real hasheada.
        const credencial = await crearCredencial(password)
        userProfile = {
          email: formattedEmail,
          nombreCompleto: nombreCompleto || 'Profesional Dental',
          rut: rut || '',
          especialidad: especialidad || 'Cirujano Dentista',
          credencial,
        }
        localStorage.setItem(`profile_${formattedEmail}`, JSON.stringify(userProfile))
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
        localStorage.setItem(`profile_${formattedEmail}`, JSON.stringify(userProfile))
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
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-black text-white font-medium py-2.5 rounded-lg text-sm hover:bg-gray-800 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Verificando...' : isFirstTime ? 'Guardar datos e Ingresar' : 'Ingresar al sistema'}
          </button>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}