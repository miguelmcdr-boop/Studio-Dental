import { useState } from 'react'

/**
 * F7-11: Hook que detecta si la URL contiene una invitación pendiente.
 * Extraído de App.jsx para cumplir con el límite constitucional de 370 líneas.
 *
 * @returns {boolean} invitacionPendiente - true si hay token en hash
 */
export const useInvitacionHash = () => {
  const [invitacionPendiente] = useState(() => {
    try {
      const hash = window.location.hash
      return hash.includes('aceptar-invita') && hash.includes('token=')
    } catch {
      return false
    }
  })

  return invitacionPendiente
}
