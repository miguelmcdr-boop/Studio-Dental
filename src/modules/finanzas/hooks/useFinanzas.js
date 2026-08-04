import { useState, useMemo, useCallback } from 'react'
import { CONVENIOS_DEFAULT } from '../constants/finanzasConstants'
import { finanzasStorageService } from '../services/finanzasStorageService'
import { calcularBalanceCaja } from '../utils/finanzasCalculations'

export const useFinanzas = () => {
  const [movimientos, setMovimientos] = useState(() => 
    finanzasStorageService.obtenerMovimientos([])
  )
  const [convenios, setConvenios] = useState(() => 
    finanzasStorageService.obtenerConvenios(CONVENIOS_DEFAULT)
  )
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const balance = useMemo(() => calcularBalanceCaja(movimientos), [movimientos])

  const movimientosFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') return movimientos
    return movimientos.filter(m => m.tipo === filtroTipo)
  }, [movimientos, filtroTipo])

  const agregarMovimiento = useCallback((nuevoMov) => {
    setMovimientos(prev => {
      const actualizados = [nuevoMov, ...prev]
      finanzasStorageService.guardarMovimientos(actualizados)
      return actualizados
    })
  }, [])

  const eliminarMovimiento = useCallback((idMov) => {
    if (window.confirm('¿Estás seguro de eliminar este registro del flujo de caja?')) {
      setMovimientos(prev => {
        const actualizados = prev.filter(m => m.id !== idMov)
        finanzasStorageService.guardarMovimientos(actualizados)
        return actualizados
      })
    }
  }, [])

  const actualizarDescuentoConvenio = useCallback((idConvenio, nuevoDescuento) => {
    setConvenios(prev => {
      const actualizados = prev.map(c => 
        c.id === idConvenio ? { ...c, descuentoDefecto: parseFloat(nuevoDescuento) || 0 } : c
      )
      finanzasStorageService.guardarConvenios(actualizados)
      return actualizados
    })
  }, [])

  return {
    movimientos: movimientosFiltrados,
    movimientosTotales: movimientos,
    convenios,
    balance,
    filtroTipo,
    setFiltroTipo,
    agregarMovimiento,
    eliminarMovimiento,
    actualizarDescuentoConvenio
  }
}