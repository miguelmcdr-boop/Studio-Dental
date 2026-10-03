import { useState } from 'react'

/**
 * F7-11: Hook que detecta si la URL contiene una invitación pendiente.
 * Extraído de App.jsx para cumplir con el límite constitucional de 370 líneas.
 *
 * @returns invitacionPendiente - true si hay token en hash
 */
export const useInvitacionHash = (): boolean => {
  const [invitacionPendiente] = useState<boolean>(() => {
    try {
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      return hash.includes('aceptar-invita') && hash.includes('token=')
    } catch {
      return false
    }
  })

  return invitacionPendiente
}
