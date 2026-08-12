import { useState, useEffect, useCallback } from 'react'
// F2-07b: acceso centralizado vía servicio
import { quirurgicoStorageService } from '../services/quirurgicoStorageService'

export const useQuirurgico = (pacienteId) => {
  const [implantes, setImplantes] = useState(() => {
    try {
      // F2-07b: cargar vía servicio (antes localStorage directo)
      return quirurgicoStorageService.obtenerImplantesDePaciente(pacienteId, [])
    } catch {
      return []
    }
  })

  const [endodoncias, setEndodoncias] = useState(() => {
    try {
      // F2-07b: cargar vía servicio (antes localStorage directo)
      return quirurgicoStorageService.obtenerEndodonciasDePaciente(pacienteId, [])
    } catch {
      return []
    }
  })

  // F2-07b: persistir vía servicio (antes localStorage directo)
  useEffect(() => {
    quirurgicoStorageService.guardarImplantesDePaciente(pacienteId, implantes)
  }, [implantes, pacienteId])

  useEffect(() => {
    quirurgicoStorageService.guardarEndodonciasDePaciente(pacienteId, endodoncias)
  }, [endodoncias, pacienteId])

  const agregarImplante = useCallback((nuevoImplante) => {
    setImplantes(prev => [{ id: Date.now(), fecha: new Date().toLocaleDateString('es-CL'), ...nuevoImplante }, ...prev])
  }, [])

  const eliminarImplante = useCallback((id) => {
    setImplantes(prev => prev.filter(item => item.id !== id))
  }, [])

  const agregarEndodoncia = useCallback((nuevaEndodoncia) => {
    setEndodoncias(prev => [{ id: Date.now(), fecha: new Date().toLocaleDateString('es-CL'), ...nuevaEndodoncia }, ...prev])
  }, [])

  const eliminarEndodoncia = useCallback((id) => {
    setEndodoncias(prev => prev.filter(item => item.id !== id))
  }, [])

  return {
    implantes,
    endodoncias,
    agregarImplante,
    eliminarImplante,
    agregarEndodoncia,
    eliminarEndodoncia
  }
}