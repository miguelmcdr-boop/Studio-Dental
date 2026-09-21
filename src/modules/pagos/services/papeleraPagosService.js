/**
 * Papelera de pagos con retención de 730 días (Commit K)
 *
 * Gestiona pagos con estado 'Purgado':
 * - obtenerPagosPurgados: lista pagos en papelera
 * - restaurarPago: cambia estado a 'Anulado' (reversible)
 * - limpiarVencidos: elimina definitivamente pagos con >730 días desde purga
 * - diasRestantes: calcula días hasta auto-eliminación
 *
 * La eliminación definitiva se propaga a Supabase vía guardarPagos().
 */
import { pagosStorageService } from './pagosStorageService'
import { createLogger } from '../../../services/logger'

const log = createLogger('papeleraPagosService')

const DIAS_RETENCION = 730
const MS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Convierte fecha chilena DD/MM/YYYY a Date object
 */
const parseFechaChilena = (fechaStr) => {
  if (!fechaStr || typeof fechaStr !== 'string') return null
  const match = fechaStr.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd))
}

/**
 * Calcula días transcurridos desde una fecha chilena
 */
const diasTranscurridos = (fechaStr) => {
  const fecha = parseFechaChilena(fechaStr)
  if (!fecha) return null
  const ahora = new Date()
  const diff = ahora.getTime() - fecha.getTime()
  return Math.floor(diff / MS_POR_DIA)
}

/**
 * Calcula días restantes hasta auto-eliminación
 */
export const diasRestantes = (fechaPurga) => {
  const transcurridos = diasTranscurridos(fechaPurga)
  if (transcurridos === null) return null
  return Math.min(DIAS_RETENCION, Math.max(0, DIAS_RETENCION - transcurridos))
}

/**
 * Obtiene todos los pagos con estado 'Purgado'
 */
export const obtenerPagosPurgados = () => {
  const todos = pagosStorageService.obtenerPagos([])
  return todos.filter(p => p.estado === 'Purgado')
}

/**
 * Restaura un pago purgado (cambia estado a 'Anulado')
 */
export const restaurarPago = async (pagoId) => {
  const todos = pagosStorageService.obtenerPagos([])
  const actualizados = todos.map(p =>
    String(p.id) === String(pagoId) && p.estado === 'Purgado'
      ? { ...p, estado: 'Anulado', motivoPurga: null, fechaPurga: null, purgadoPor: null }
      : p
  )

  const pago = todos.find(p => String(p.id) === String(pagoId))
  if (!pago || pago.estado !== 'Purgado') {
    log.warn(`restaurarPago: pago ${pagoId} no encontrado o no está purgado`)
    return false
  }

  await pagosStorageService.guardarPagos(actualizados)
  log.info(`[AUDITORÍA] Restauración de pago: id=${pagoId}, folio=${pago.folioComprobante || 's/d'}, monto=${pago.monto}`)
  return true
}

/**
 * Elimina definitivamente pagos con >730 días desde purga.
 * Job automático al cargar el módulo.
 */
export const limpiarVencidos = async () => {
  const todos = pagosStorageService.obtenerPagos([])
  const vencidos = todos.filter(p => {
    if (p.estado !== 'Purgado') return false
    const dias = diasTranscurridos(p.fechaPurga)
    return dias !== null && dias > DIAS_RETENCION
  })

  if (vencidos.length === 0) return 0

  const restantes = todos.filter(p => {
    if (p.estado !== 'Purgado') return true
    const dias = diasTranscurridos(p.fechaPurga)
    return dias === null || dias <= DIAS_RETENCION
  })

  await pagosStorageService.guardarPagos(restantes)

  vencidos.forEach(p => {
    const dias = diasTranscurridos(p.fechaPurga)
    log.warn(`[AUDITORÍA] Eliminación automática de pago purgado: id=${p.id}, folio=${p.folioComprobante || 's/d'}, monto=${p.monto}, días_desde_purga=${dias}`)
  })

  return vencidos.length
}

/**
 * Vacía la papelera: elimina definitivamente TODOS los pagos purgados.
 * La eliminación se propaga a Supabase vía guardarPagos (hard delete).
 * @returns {number} cantidad de pagos eliminados
 */
export const vaciarPapelera = async () => {
  const todos = pagosStorageService.obtenerPagos([])
  const purgados = todos.filter(p => p.estado === 'Purgado')
  if (purgados.length === 0) return 0

  const restantes = todos.filter(p => p.estado !== 'Purgado')
  await pagosStorageService.guardarPagos(restantes)

  purgados.forEach(p => {
    log.warn(`[AUDITORÍA] Vaciar papelera: eliminación definitiva id=${p.id}, folio=${p.folioComprobante || 's/d'}, monto=${p.monto}, purgado=${p.fechaPurga || 's/f'}`)
  })

  return purgados.length
}
