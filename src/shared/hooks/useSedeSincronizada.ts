/**
 * Hook para estado de sincronización real de sede/colas offline (BP03 §04)
 */
import { useEffect, useState } from 'react'

export const countPendingOps = (): number => {
  if (typeof localStorage === 'undefined') return 0
  try {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('pending') || key.includes('cola_'))) {
        const val = localStorage.getItem(key)
        if (val) {
          const parsed = JSON.parse(val)
          count += Array.isArray(parsed) ? parsed.length : (parsed ? 1 : 0)
        }
      }
    }
    return count
  } catch {
    return 0
  }
}

const isDesincronizado = () =>
  typeof navigator !== 'undefined' && !navigator.onLine && countPendingOps() > 0

export const useSedeSincronizada = (): boolean => {
  const [sincronizado, setSincronizado] = useState<boolean>(() => !isDesincronizado())

  useEffect(() => {
    const checkSync = () => setSincronizado(!isDesincronizado())
    checkSync()
    window.addEventListener('online', checkSync)
    window.addEventListener('offline', checkSync)
    const interval = setInterval(checkSync, 1000)

    return () => {
      window.removeEventListener('online', checkSync)
      window.removeEventListener('offline', checkSync)
      clearInterval(interval)
    }
  }, [])

  return sincronizado
}
