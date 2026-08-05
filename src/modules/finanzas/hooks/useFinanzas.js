import { useState, useMemo, useEffect, useCallback } from 'react'
import { finanzasStorageService } from '../services/finanzasStorageService'
import { calcularBalanceFinanzas } from '../utils/finanzasCalculations'

export const useFinanzas = (pacientes = []) => {
  const [movimientosManuales, setMovimientosManuales] = useState(() =>
    finanzasStorageService.obtenerMovimientos([])
  )

  const [fechaArqueo, setFechaArqueo] = useState(
    new Date().toLocaleDateString('es-CL')
  )

  // Escanear todos los abonos y pagos globales del localStorage
  const [todosLosAbonosYPagos, setTodosLosAbonosYPagos] = useState([])

  const recargarTransaccionesConsolidadas = useCallback(() => {
    const listaConsolidada = []

    // 1. Cargar Pagos Globales
    try {
      const pagosGlobales = JSON.parse(localStorage.getItem('clinica_historial_pagos') || '[]')
      if (Array.isArray(pagosGlobales)) {
        pagosGlobales.forEach(p => {
          listaConsolidada.push({
            id: `pago_global_${p.id}`,
            fecha: p.fecha || new Date().toLocaleDateString('es-CL'),
            tipo: 'Ingreso',
            categoria: 'Pago Paciente (Boleta/Factura)',
            monto: parseInt(p.monto || 0),
            metodoPago: p.metodoPago || 'Efectivo',
            pacienteNombre: p.pacienteNombre || 'Paciente General',
            origen: 'Pagos'
          })
        })
      }
    } catch (e) {
      console.error(e)
    }

    // 2. Cargar Abonos de cada Paciente
    pacientes.forEach(pac => {
      try {
        const abonosPac = JSON.parse(localStorage.getItem(`abonos_${pac.id}`) || '[]')
        if (Array.isArray(abonosPac)) {
          abonosPac.forEach(a => {
            listaConsolidada.push({
              id: `abono_${pac.id}_${a.id}`,
              fecha: a.fecha || new Date().toLocaleDateString('es-CL'),
              tipo: 'Ingreso',
              categoria: 'Abono Plan de Tratamiento',
              monto: parseInt(a.monto || 0),
              metodoPago: a.metodoPago || 'Efectivo',
              pacienteNombre: pac.nombre,
              origen: 'Presupuestos'
            })
          })
        }
      } catch (e) {
        console.error(e)
      }
    })

    setTodosLosAbonosYPagos(listaConsolidada)
  }, [pacientes])

  useEffect(() => {
    recargarTransaccionesConsolidadas()

    window.addEventListener('storage', recargarTransaccionesConsolidadas)
    return () => window.removeEventListener('storage', recargarTransaccionesConsolidadas)
  }, [recargarTransaccionesConsolidadas])

  // Unificar movimientos manuales con cobros de pacientes
  const movimientosConsolidadosTotal = useMemo(() => {
    return [...movimientosManuales, ...todosLosAbonosYPagos]
  }, [movimientosManuales, todosLosAbonosYPagos])

  // Filtrar para el día del Arqueo de Caja
  const transaccionesDiaArqueo = useMemo(() => {
    return movimientosConsolidadosTotal.filter(m => m.fecha === fechaArqueo)
  }, [movimientosConsolidadosTotal, fechaArqueo])

  const balanceGlobal = useMemo(() => {
    return calcularBalanceFinanzas(movimientosConsolidadosTotal)
  }, [movimientosConsolidadosTotal])

  const agregarMovimiento = useCallback((movData) => {
    setMovimientosManuales(prev => {
      const actualizados = [movData, ...prev]
      finanzasStorageService.guardarMovimientos(actualizados)
      return actualizados
    })
  }, [])

  const eliminarMovimiento = useCallback((id) => {
    if (window.confirm('¿Deseas eliminar este registro de movimiento de caja chica?')) {
      setMovimientosManuales(prev => {
        const actualizados = prev.filter(m => m.id !== id)
        finanzasStorageService.guardarMovimientos(actualizados)
        return actualizados
      })
    }
  }, [])

  return {
    movimientos: movimientosConsolidadosTotal,
    transaccionesDiaArqueo,
    fechaArqueo,
    setFechaArqueo,
    balanceGlobal,
    agregarMovimiento,
    eliminarMovimiento,
    recargarTransaccionesConsolidadas
  }
}