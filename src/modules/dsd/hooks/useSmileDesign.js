import { useState, useEffect, useMemo, useCallback } from 'react'
import { calcularRatioAnchoAlto, calcularVisibilidadDorada } from '../utils/dsdCalculations'

export const useSmileDesign = (pacienteId) => {
  const STORAGE_KEY = `dsd_config_${pacienteId}`

  const [dsdData, setDsdData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {
        anchoCentral: 8.5,
        altoCentral: 10.5,
        tonoActual: 'A2',
        tonoDeseado: 'BL2',
        formaDeseada: 'ovoidal',
        lineaSonrisa: 'Media (Muestra 100% de corona clínica)',
        observacionEstetica: ''
      }
    } catch (e) {
      return { anchoCentral: 8.5, altoCentral: 10.5, tonoDeseado: 'BL2' }
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dsdData))
  }, [dsdData, STORAGE_KEY])

  const ratioAnchoAlto = useMemo(() => {
    return calcularRatioAnchoAlto(dsdData.anchoCentral, dsdData.altoCentral)
  }, [dsdData.anchoCentral, dsdData.altoCentral])

  const visibilidadDorada = useMemo(() => {
    return calcularVisibilidadDorada(dsdData.anchoCentral)
  }, [dsdData.anchoCentral])

  const esProporcionIdeal = ratioAnchoAlto >= 0.75 && ratioAnchoAlto <= 0.85

  const actualizarAtributoDsd = useCallback((campo, valor) => {
    setDsdData(prev => ({ ...prev, [campo]: valor }))
  }, [])

  return {
    dsdData,
    ratioAnchoAlto,
    visibilidadDorada,
    esProporcionIdeal,
    actualizarAtributoDsd
  }
}