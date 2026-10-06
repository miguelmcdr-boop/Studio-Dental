/**
 * Hook para ciclo de vida de guardado en TopBar (BP03 §08 Feature 3)
 * Expone estado derivado: 'neutral' | 'dirty' | 'saved' (con timeout de 2s)
 */
import { useEffect, useState } from 'react'
import { useTopBarStore } from '../../app/stores/useTopBarStore'

export type GuardadoStatus = 'neutral' | 'dirty' | 'saved'

export const useGuardadoState = (): GuardadoStatus => {
  const isDirty = useTopBarStore((s) => s.isDirty)
  const savedAt = useTopBarStore((s) => s.savedAt)
  const [status, setStatus] = useState<GuardadoStatus>('neutral')

  useEffect(() => {
    if (isDirty) {
      setStatus('dirty')
      return
    }

    if (savedAt && Date.now() - savedAt < 2100) {
      setStatus('saved')
      const remaining = Math.max(0, 2000 - (Date.now() - savedAt))
      const timer = setTimeout(() => {
        setStatus('neutral')
      }, remaining)
      return () => clearTimeout(timer)
    }

    setStatus('neutral')
  }, [isDirty, savedAt])

  return status
}
