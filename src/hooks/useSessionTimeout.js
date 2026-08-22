import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook de timeout de sesión por inactividad (F6-H).
 *
 * Detecta actividad del usuario (mouse, teclado, scroll, touch) y dispara
 * un logout forzado tras un período de inactividad configurable. Muestra
 * una advertencia antes del logout para dar oportunidad de guardar cambios.
 *
 * @param {Object} options
 * @param {boolean} options.activo - Si el timeout está activo (false si no hay sesión)
 * @param {number} [options.timeoutMs=1800000] - Inactividad máxima (default 30 min)
 * @param {number} [options.warnMs=120000] - Anticipación de advertencia (default 2 min)
 * @param {Function} options.onTimeout - Callback al expirar (logout forzado)
 * @param {Function} [options.onWarning] - Callback al mostrar advertencia
 */
export const useSessionTimeout = ({
  activo,
  timeoutMs = 30 * 60 * 1000,
  warnMs = 2 * 60 * 1000,
  onTimeout,
  onWarning
}) => {
  const warnTimerRef = useRef(null)
  const timeoutTimerRef = useRef(null)
  const advertidoRef = useRef(false)

  const limpiarTimers = useCallback(() => {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current)
    warnTimerRef.current = null
    timeoutTimerRef.current = null
  }, [])

  const iniciarTimers = useCallback(() => {
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
      if (onTimeout) onTimeout()
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
    const handleActivity = () => {
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
