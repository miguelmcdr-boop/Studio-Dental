import { useEffect, useRef, useCallback } from 'react'

export interface UseSessionTimeoutOptions {
  activo: boolean
  timeoutMs?: number
  warnMs?: number
  onTimeout?: () => void | Promise<void>
  onWarning?: () => void
}

/**
 * Hook de timeout de sesión por inactividad (F6-H).
 *
 * Detecta actividad del usuario (mouse, teclado, scroll, touch) y dispara
 * un logout forzado tras un período de inactividad configurable. Muestra
 * una advertencia antes del logout para dar oportunidad de guardar cambios.
 *
 * @param options Opciones de configuración
 * @param options.activo - Si el timeout está activo (false si no hay sesión)
 * @param options.timeoutMs - Inactividad máxima (default 30 min)
 * @param options.warnMs - Anticipación de advertencia (default 2 min)
 * @param options.onTimeout - Callback al expirar (logout forzado)
 * @param options.onWarning - Callback al mostrar advertencia
 */
export const useSessionTimeout = ({
  activo,
  timeoutMs = 30 * 60 * 1000,
  warnMs = 2 * 60 * 1000,
  onTimeout,
  onWarning
}: UseSessionTimeoutOptions): void => {
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advertidoRef = useRef<boolean>(false)

  const limpiarTimers = useCallback((): void => {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current)
    warnTimerRef.current = null
    timeoutTimerRef.current = null
  }, [])

  const iniciarTimers = useCallback((): void => {
    limpiarTimers()
    advertidoRef.current = false

    // Timer de advertencia (timeoutMs - warnMs desde la última actividad)
    const warnDelay = Math.max(timeoutMs - warnMs, 0)
    warnTimerRef.current = setTimeout(() => {
      advertidoRef.current = true
      if (onWarning) onWarning()
    }, warnDelay)

    // Timer de logout forzado
    timeoutTimerRef.current = setTimeout(() => {
      if (onTimeout) void onTimeout()
    }, timeoutMs)
  }, [timeoutMs, warnMs, onTimeout, onWarning, limpiarTimers])

  useEffect(() => {
    if (!activo) {
      limpiarTimers()
      return
    }

    iniciarTimers()

    // Eventos que cuentan como actividad del usuario
    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    const handleActivity = (): void => {
      // Si ya se mostró advertencia y hay actividad, reiniciar sin re-advertir
      iniciarTimers()
    }

    eventos.forEach((evento) =>
      window.addEventListener(evento, handleActivity, { passive: true })
    )

    return () => {
      limpiarTimers()
      eventos.forEach((evento) => window.removeEventListener(evento, handleActivity))
    }
  }, [activo, iniciarTimers, limpiarTimers])
}
