import { useState, useEffect, useMemo, useCallback } from 'react'
import { TIPOS_CONVENIO } from '../constants/finanzasConstants'
import { calcularPrecioConConvenio, calcularLiquidacionEspecialista } from '../utils/finanzasCalculations'

export const useFinanzas = () => {
  const STORAGE_KEY_CONVENIOS = 'finanzas_config_convenios'
  const STORAGE_KEY_LIQUIDACIONES = 'finanzas_historial_liquidaciones'

  const [convenios, setConvenios] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONVENIOS)
      return saved ? JSON.parse(saved) : TIPOS_CONVENIO
    } catch (e) {
      return TIPOS_CONVENIO
    }
  })

  const [liquidaciones, setLiquidaciones] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LIQUIDACIONES)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONVENIOS, JSON.stringify(convenios))
  }, [convenios])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LIQUIDACIONES, JSON.stringify(liquidaciones))
  }, [liquidaciones])

  const actualizarDescuentoConvenio = useCallback((idConvenio, nuevoPorcentaje) => {
    setConvenios(prev => prev.map(c => c.id === idConvenio ? { ...c, descuentoDefecto: parseFloat(nuevoPorcentaje) || 0 } : c))
  }, [])

  const guardarLiquidacion = useCallback((nuevaLiquidacion) => {
    setLiquidaciones(prev => [{ id: Date.now(), fecha: new Date().toLocaleDateString('es-CL'), ...nuevaLiquidacion }, ...prev])
  }, [])

  const eliminarLiquidacion = useCallback((id) => {
    setLiquidaciones(prev => prev.filter(l => l.id !== id))
  }, [])

  return {
    convenios,
    liquidaciones,
    actualizarDescuentoConvenio,
    guardarLiquidacion,
    eliminarLiquidacion,
    calcularPrecioConConvenio,
    calcularLiquidacionEspecialista
  }
}