import { useState, useMemo, useEffect, useCallback } from 'react'
import { finanzasStorageService } from '../services/finanzasStorageService'
import { calcularBalanceFinanzas } from '../utils/finanzasCalculations'
import { CONVENIOS_DEFAULT } from '../constants/finanzasConstants'
import { pagosStorageService } from '../../pagos/services/pagosStorageService'
import { createLogger } from '../../../services/logger.js'
import { useAppDialog } from '../../../hooks/useAppDialog'

const log = createLogger('useFinanzas')

export const useFinanzas = (pacientes = []) => {
  const { confirm } = useAppDialog()
  const [movimientosManuales, setMovimientosManuales] = useState(() =>
    finanzasStorageService.obtenerMovimientos([])
  )
  const [convenios, setConvenios] = useState(() =>
    finanzasStorageService.obtenerConvenios(CONVENIOS_DEFAULT)
  )
  const [fechaArqueo, setFechaArqueo] = useState(
    new Date().toLocaleDateString('es-CL')
  )
  const [todosLosAbonosYPagos, setTodosLosAbonosYPagos] = useState([])

  const recargarTransaccionesConsolidadas = useCallback(() => {
    const lista = []
    const hoy = () => new Date().toLocaleDateString('es-CL')
    let pagos = []
    try {
      pagos = pagosStorageService.obtenerPagos([]) || []
    } catch (e) {
      log.error(e)
    }
    const idsPago = new Set(pagos.map(p => String(p.id)))
    // Pagos globales vigentes: los anulados quedan solo en auditoría de Pagos
    pagos.forEach(p => {
      if (p.estado === 'Anulado' || p.estado === 'Purgado') return
      lista.push({
        id: `pago_global_${p.id}`, fecha: p.fecha || hoy(), tipo: 'Ingreso',
        categoria: 'Pago Paciente (Boleta/Factura)', monto: parseInt(p.monto || 0),
        metodoPago: p.metodoPago || 'Efectivo',
        pacienteNombre: p.pacienteNombre || 'Paciente General', origen: 'Pagos'
      })
    })
    // Abonos de ficha que NO duplican un pago global (evita doble conteo)
    const idsAbonoVistos = new Set()
    pacientes.forEach(pac => {
      let abonos = []
      try {
        abonos = pagosStorageService.obtenerAbonosPorPaciente(pac.id) || []
      } catch (e) {
        log.error(e)
      }
      abonos.forEach(a => {
        const aid = String(a.id)
        if (idsPago.has(aid) || idsAbonoVistos.has(aid)) return
        idsAbonoVistos.add(aid)
        lista.push({
          id: `abono_${pac.id}_${a.id}`, fecha: a.fecha || hoy(), tipo: 'Ingreso',
          categoria: 'Abono Plan de Tratamiento', monto: parseInt(a.monto || 0),
          metodoPago: a.metodoPago || 'Efectivo', pacienteNombre: pac.nombre,
          origen: 'Presupuestos'
        })
      })
    })
    setTodosLosAbonosYPagos(lista)
  }, [pacientes])

  useEffect(() => {
    recargarTransaccionesConsolidadas()
    window.addEventListener('storage', recargarTransaccionesConsolidadas)
    return () => window.removeEventListener('storage', recargarTransaccionesConsolidadas)
  }, [recargarTransaccionesConsolidadas])

  const movimientosConsolidadosTotal = useMemo(() => {
    return [...movimientosManuales, ...todosLosAbonosYPagos]
  }, [movimientosManuales, todosLosAbonosYPagos])

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

  const eliminarMovimiento = useCallback(async (id) => {
    const strId = String(id)
    const esPagoGlobal = strId.startsWith('pago_global_')
    const esAbono = strId.startsWith('abono_')
    const ok = await confirm({
      title: 'Eliminar movimiento',
      description: esPagoGlobal || esAbono
        ? 'Se eliminará el registro original en Pagos / Ficha Clínica. ¿Continuar?'
        : '¿Deseas eliminar este registro de movimiento de caja chica?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (!ok) return
    if (esPagoGlobal) {
      pagosStorageService.eliminarPago(strId.replace('pago_global_', ''))
    } else if (esAbono) {
      const partes = strId.split('_')
      pagosStorageService.eliminarAbono(partes[1], partes.slice(2).join('_'))
    } else {
      setMovimientosManuales(prev => {
        const actualizados = prev.filter(m => m.id !== id)
        finanzasStorageService.guardarMovimientos(actualizados)
        return actualizados
      })
    }
    recargarTransaccionesConsolidadas()
  }, [recargarTransaccionesConsolidadas])

  const actualizarDescuentoConvenio = useCallback((convenioId, nuevoDescuento) => {
    setConvenios(prev => {
      const actualizados = prev.map(c =>
        c.id === convenioId ? { ...c, descuentoDefecto: parseFloat(nuevoDescuento) || 0 } : c
      )
      finanzasStorageService.guardarConvenios(actualizados)
      return actualizados
    })
  }, [])

  return {
    movimientos: movimientosConsolidadosTotal,
    transaccionesDiaArqueo,
    fechaArqueo,
    setFechaArqueo,
    balanceGlobal,
    agregarMovimiento,
    eliminarMovimiento,
    recargarTransaccionesConsolidadas,
    convenios,
    actualizarDescuentoConvenio
  }
}
