import { useState, useEffect, useCallback } from 'react'
import { sedesService } from '../services/sedesService'
import { type Sede } from '../schemas/sedeSchema'

export interface UseSedesReturn {
  sedes: Sede[]
  sedeActiva: Sede | null
  sedeActivaId: string | null
  cambiarSede: (sedeId: string) => void
  agregarSede: (sede: Omit<Sede, 'id'>) => Sede
  editarSede: (id: string, updates: Partial<Sede>) => Sede
  eliminarSede: (id: string) => boolean
  recargar: () => void
}

export const useSedes = (): UseSedesReturn => {
  const [sedes, setSedes] = useState<Sede[]>(() => sedesService.obtenerSedes())
  const [sedeActivaId, setSedeActivaId] = useState<string | null>(() => sedesService.obtenerSedeActiva())

  const recargar = useCallback(() => {
    const lista = sedesService.obtenerSedes()
    setSedes(lista)
    setSedeActivaId(sedesService.obtenerSedeActiva())
  }, [])

  useEffect(() => {
    recargar()
    const handleStorage = () => recargar()
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [recargar])

  const cambiarSede = useCallback((id: string) => {
    sedesService.establecerSedeActiva(id)
    setSedeActivaId(id)
  }, [])

  const agregarSede = useCallback((datos: Omit<Sede, 'id'>): Sede => {
    const creada = sedesService.crearSede(datos)
    recargar()
    return creada
  }, [recargar])

  const editarSede = useCallback((id: string, updates: Partial<Sede>): Sede => {
    const actualizada = sedesService.actualizarSede(id, updates)
    recargar()
    return actualizada
  }, [recargar])

  const eliminarSede = useCallback((id: string): boolean => {
    const ok = sedesService.eliminarSede(id)
    recargar()
    return ok
  }, [recargar])

  const sedeActiva = sedes.find((s) => s.id === sedeActivaId) || sedes[0] || null

  return {
    sedes,
    sedeActiva,
    sedeActivaId,
    cambiarSede,
    agregarSede,
    editarSede,
    eliminarSede,
    recargar,
  }
}
