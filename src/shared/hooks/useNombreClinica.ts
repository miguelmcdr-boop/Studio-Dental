import { useState, useEffect } from 'react'
import {
  obtenerNombreClinica,
  suscribirNombre,
} from '../../domains/organization/clinic'

export const useNombreClinica = (perfilNombre?: unknown): string => {
  const [nombre, setNombre] = useState<string>(() => {
    const inicial = obtenerNombreClinica()
    if (inicial && inicial !== 'Mi Consulta') return inicial
    if (typeof perfilNombre === 'string' && perfilNombre.trim()) return perfilNombre.trim()
    return inicial || 'Mi Consulta'
  })

  useEffect(() => {
    if (typeof perfilNombre === 'string' && perfilNombre.trim()) {
      setNombre(perfilNombre.trim())
    }
  }, [perfilNombre])

  useEffect(() => {
    const unsubscribe = suscribirNombre((nuevoNombre) => {
      if (nuevoNombre && typeof nuevoNombre === 'string') {
        setNombre(nuevoNombre.trim() || 'Mi Consulta')
      }
    })
    return unsubscribe
  }, [])

  return nombre
}
