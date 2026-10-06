import { useState, useEffect, useCallback } from 'react'

export type EstadoLogin =
  | 'vacio'
  | 'cargando'
  | 'error_credenciales'
  | 'error_red'
  | 'cuenta_bloqueada'
  | 'email_no_verificado'
  | 'cuenta_desactivada'
  | 'mantenimiento'
  | 'navegador_antiguo'

const LOCKOUT_KEY = 'dentikos_login_lockout'
const MAX_FALLOS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutos

interface LockoutData {
  fallos: number
  bloqueadoHasta: number | null
}

const leerLockout = (): LockoutData => {
  if (typeof localStorage === 'undefined') return { fallos: 0, bloqueadoHasta: null }
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY)
    if (!raw) return { fallos: 0, bloqueadoHasta: null }
    return JSON.parse(raw) as LockoutData
  } catch {
    return { fallos: 0, bloqueadoHasta: null }
  }
}

const guardarLockout = (data: LockoutData): void => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data))
  } catch {
    // Fail-safe si storage no está disponible
  }
}

export interface UseLoginStatesParams {
  email: string
  password: string
}

export interface UseLoginStatesReturn {
  estado: EstadoLogin
  errorMsg: string
  tiempoRestanteBloqueo: number
  setEstado: (e: EstadoLogin) => void
  setErrorMsg: (msg: string) => void
  registrarFalloLogin: () => void
  resetearFallosLogin: () => void
  procesarErrorAuth: (error: string) => void
}

export const useLoginStates = ({ email, password }: UseLoginStatesParams): UseLoginStatesReturn => {
  const [estado, setEstado] = useState<EstadoLogin>('vacio')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [tiempoRestanteBloqueo, setTiempoRestanteBloqueo] = useState<number>(0)

  // Verificar navegador antiguo o mantenimiento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cryptoSoportado = typeof window.crypto?.getRandomValues === 'function'
      const storageSoportado = typeof window.localStorage !== 'undefined'
      if (!cryptoSoportado || !storageSoportado) {
        setEstado('navegador_antiguo')
        setErrorMsg('Tu navegador no cuenta con las características criptográficas requeridas.')
        return
      }
    }

    if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
      setEstado('mantenimiento')
      setErrorMsg('Estamos realizando labores de optimización quirúrgica. Vuelve en breve.')
      return
    }

    const { bloqueadoHasta } = leerLockout()
    const ahora = Date.now()
    if (bloqueadoHasta && bloqueadoHasta > ahora) {
      setEstado('cuenta_bloqueada')
      const minutos = Math.ceil((bloqueadoHasta - ahora) / 60000)
      setTiempoRestanteBloqueo(minutos)
      setErrorMsg(`Demasiados intentos fallidos. Intenta en ${minutos} minutos.`)
    }
  }, [])

  // Sincronizar estado vacío si no está en error crítico o cargando
  useEffect(() => {
    if (['cargando', 'cuenta_bloqueada', 'mantenimiento', 'navegador_antiguo'].includes(estado)) {
      return
    }
    if (email.trim() === '' || password === '') {
      setEstado('vacio')
    }
  }, [email, password, estado])

  const registrarFalloLogin = useCallback(() => {
    const data = leerLockout()
    const nuevosFallos = data.fallos + 1
    if (nuevosFallos >= MAX_FALLOS) {
      const hasta = Date.now() + LOCKOUT_DURATION_MS
      guardarLockout({ fallos: nuevosFallos, bloqueadoHasta: hasta })
      setEstado('cuenta_bloqueada')
      setTiempoRestanteBloqueo(15)
      setErrorMsg('Demasiados intentos fallidos. Intenta en 15 minutos.')
    } else {
      guardarLockout({ fallos: nuevosFallos, bloqueadoHasta: null })
    }
  }, [])

  const resetearFallosLogin = useCallback(() => {
    guardarLockout({ fallos: 0, bloqueadoHasta: null })
    setTiempoRestanteBloqueo(0)
  }, [])

  const procesarErrorAuth = useCallback((error: string) => {
    registrarFalloLogin()
    const lower = error.toLowerCase()

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setEstado('error_red')
      setErrorMsg('No se pudo conectar con el servidor. Verifica tu conexión a internet.')
      return
    }

    if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
      setEstado('error_red')
      setErrorMsg('No se pudo conectar. Verifica tu conexión.')
      return
    }

    if (lower.includes('email not confirmed') || lower.includes('no verificado')) {
      setEstado('email_no_verificado')
      setErrorMsg('Verifica tu email antes de iniciar sesión.')
      return
    }

    if (lower.includes('disabled') || lower.includes('desactivad') || lower.includes('inactiv')) {
      setEstado('cuenta_desactivada')
      setErrorMsg('Tu cuenta está desactivada. Contacta al administrador de tu clínica.')
      return
    }

    // Regla de seguridad: credenciales genéricas (NO revelar si el email existe o no)
    setEstado('error_credenciales')
    setErrorMsg('Email o contraseña incorrectos.')
  }, [registrarFalloLogin])

  return {
    estado,
    errorMsg,
    tiempoRestanteBloqueo,
    setEstado,
    setErrorMsg,
    registrarFalloLogin,
    resetearFallosLogin,
    procesarErrorAuth,
  }
}
