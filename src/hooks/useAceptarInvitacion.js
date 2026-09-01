import { useState, useEffect } from 'react'
import { aceptarInvitacion, supabaseSignIn, supabaseSignUp } from '../services/authService'
import { createLogger } from '../services/logger'

const log = createLogger('useAceptarInvitacion')

/**
 * F7-11: Hook que maneja la lógica de aceptación de invitaciones.
 * Extraído de AceptarInvitacion.jsx para cumplir con límite de 250 líneas JSX.
 *
 * @param {string} token - Token de la invitación
 * @param {Function} onAceptarExitoso - Callback cuando se acepta exitosamente
 * @returns {Object} estado, error, handlers
 */
export const useAceptarInvitacion = (token, onAceptarExitoso) => {
  const [estado, setEstado] = useState('login')
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [modoRegistro, setModoRegistro] = useState(false)
  const [procesando, setProcesando] = useState(false)

  const handleAceptar = async () => {
    setEstado('aceptando')
    setError(null)

    try {
      const result = await aceptarInvitacion(token)

      if (result.success) {
        setEstado('exito')
        setExito('¡Has sido agregado a la clínica exitosamente!')
        window.history.replaceState(null, '', window.location.pathname)
        setTimeout(() => {
          if (onAceptarExitoso) onAceptarExitoso(result.clinicaId)
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
        result = await supabaseSignUp(email, password, { nombreCompleto, email })
      } else {
        result = await supabaseSignIn(email, password)
      }

      if (result.error) {
        setError(result.error)
      } else {
        await handleAceptar()
      }
    } catch (err) {
      log.error('Error en autenticación:', err)
      setError('Error en autenticación: ' + err.message)
    } finally {
      setProcesando(false)
    }
  }

  const toggleModo = () => setModoRegistro(!modoRegistro)

  return {
    estado, error, exito,
    email, setEmail,
    password, setPassword,
    nombreCompleto, setNombreCompleto,
    modoRegistro, procesando,
    handleSubmitAuth, toggleModo
  }
}
