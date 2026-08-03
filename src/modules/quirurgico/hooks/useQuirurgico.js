import { useState, useEffect, useCallback } from 'react'

export const useQuirurgico = (pacienteId) => {
  const STORAGE_KEY_IMPLANTES = `quirurgico_implantes_${pacienteId}`
  const STORAGE_KEY_ENDODONCIA = `quirurgico_endodoncia_${pacienteId}`

  const [implantes, setImplantes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IMPLANTES)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  const [endodoncias, setEndodoncias] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENDODONCIA)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_IMPLANTES, JSON.stringify(implantes))
  }, [implantes, STORAGE_KEY_IMPLANTES])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENDODONCIA, JSON.stringify(endodoncias))
  }, [endodoncias, STORAGE_KEY_ENDODONCIA])

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