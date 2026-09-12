/**
 * Servicio de exportación de auditoría de pagos a CSV (Commit B).
 *
 * Genera archivo CSV con TODOS los pagos (vigentes + anulados) para
 * respaldo y auditoría del administrador. Decisión 2B: incluir ambos
 * estados para trazabilidad completa.
 *
 * Sin dependencias externas: usa Blob nativo del navegador.
 */
import { createLogger } from '../../../services/logger'

const log = createLogger('pagosExportService')

const COLUMNAS_CSV = [
  'id', 'folioComprobante', 'folioDTE', 'fecha', 'hora',
  'pacienteNombre', 'pacienteRut', 'monto', 'metodoPago',
  'concepto', 'estado', 'motivoAnulacion', 'fechaAnulacion',
  'emitidoPor', 'observacion'
]

/**
 * Escapa un valor para CSV: si contiene coma, comilla o salto de línea,
 * se envuelve en comillas dobles y se escapan comillas internas.
 */
const escapar = (valor) => {
  if (valor === null || valor === undefined) return ''
  const str = String(valor)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const generarTimestamp = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}

/**
 * Exporta todos los pagos a CSV y dispara la descarga del archivo.
 * @param {Array} pagos - Array de pagos (vigentes + anulados)
 * @returns {{ok: boolean, total: number, nombreArchivo: string}}
 */
export const exportarAuditoriaPagosCSV = (pagos = []) => {
  try {
    if (!Array.isArray(pagos)) {
      log.error('exportarAuditoriaPagosCSV: pagos no es array')
      return { ok: false, total: 0, nombreArchivo: '' }
    }
    const lineas = [COLUMNAS_CSV.join(',')]
    pagos.forEach(p => {
      const fila = COLUMNAS_CSV.map(col => escapar(p[col]))
      lineas.push(fila.join(','))
    })
    const csv = lineas.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const nombreArchivo = `auditoria_pagos_${generarTimestamp()}.csv`
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    log.info(`Auditoría exportada: ${pagos.length} pagos → ${nombreArchivo}`)
    return { ok: true, total: pagos.length, nombreArchivo }
  } catch (e) {
    log.error('Error al exportar auditoría CSV:', e)
    return { ok: false, total: 0, nombreArchivo: '' }
  }
}
