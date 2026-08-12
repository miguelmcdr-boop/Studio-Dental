import { useState, useEffect, useMemo, useCallback } from 'react'
import { calcularRatioAnchoAlto, calcularVisibilidadDorada } from '../utils/dsdCalculations'
// F2-07b: acceso centralizado vía servicio
import { dsdStorageService } from '../services/dsdStorageService'

// F2-07b: default extraído a constante para claridad
const DSD_DEFAULT = {
  anchoCentral: 8.5,
  altoCentral: 10.5,
  tonoActual: 'A2',
  tonoDeseado: 'BL2',
  formaDeseada: 'ovoidal',
  lineaSonrisa: 'Media (Muestra 100% de corona clínica)',
  observacionEstetica: ''
}

export const useSmileDesign = (pacienteId) => {
  const [dsdData, setDsdData] = useState(() => {
    try {
      // F2-07b: cargar vía servicio con default estructurado
      return dsdStorageService.obtenerConfigDePaciente(pacienteId, DSD_DEFAULT)
    } catch {
      return DSD_DEFAULT
    }
  })

  // F2-07b: persistir vía servicio (antes localStorage directo)
  useEffect(() => {
    dsdStorageService.guardarConfigDePaciente(pacienteId, dsdData)
  }, [dsdData, pacienteId])

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