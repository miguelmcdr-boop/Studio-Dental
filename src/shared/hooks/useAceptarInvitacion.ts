import { useState } from 'react'
import type React from 'react'
import { aceptarInvitacion, supabaseSignIn, supabaseSignUp } from '../../infrastructure/auth/authService'
import { createLogger } from '../../infrastructure/logging/logger'

const log = createLogger('useAceptarInvitacion')

export type EstadoInvitacion = 'login' | 'aceptando' | 'exito' | 'error'

export interface UseAceptarInvitacionReturn {
  estado: EstadoInvitacion
  error: string | null
  exito: string | null
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  nombreCompleto: string
  setNombreCompleto: (nombre: string) => void
  modoRegistro: boolean
  procesando: boolean
  handleSubmitAuth: (e: React.FormEvent) => Promise<void>
  toggleModo: () => void
}

/**
 * F7-11: Hook que maneja la lógica de aceptación de invitaciones.
 * Extraído de AceptarInvitacion.jsx para cumplir con límite de 250 líneas JSX.
 *
 * @param token - Token de la invitación
 * @param onAceptarExitoso - Callback cuando se acepta exitosamente
 * @returns estado, error, handlers
 */
export const useAceptarInvitacion = (
  token: string,
  onAceptarExitoso?: (clinicaId?: string | number) => void
): UseAceptarInvitacionReturn => {
  const [estado, setEstado] = useState<EstadoInvitacion>('login')
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [nombreCompleto, setNombreCompleto] = useState<string>('')
  const [modoRegistro, setModoRegistro] = useState<boolean>(false)
  const [procesando, setProcesando] = useState<boolean>(false)

  const handleAceptar = async (): Promise<void> => {
    setEstado('aceptando')
    setError(null)

    try {
      const result = await aceptarInvitacion(token)

      if (result.success) {
        setEstado('exito')
        setExito('¡Has sido agregado a la clínica exitosamente!')
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname)
        }
        setTimeout(() => {
          if (onAceptarExitoso) onAceptarExitoso(result.clinicaId)
        }, 2000)
      } else {
        setEstado('error')
        setError(result.error || 'Error al aceptar la invitación')
      }
    } catch (err: unknown) {
      log.error('Error aceptando invitación:', err)
      setEstado('error')
      setError('Error inesperado al aceptar la invitación')
    }
  }

  const handleSubmitAuth = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setProcesando(true)
    setError(null)

    try {
      let result: { error?: string }
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error('Error en autenticación:', err)
      setError('Error en autenticación: ' + msg)
    } finally {
      setProcesando(false)
    }
  }

  const toggleModo = (): void => setModoRegistro(!modoRegistro)

  return {
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
    toggleModo
  }
}
