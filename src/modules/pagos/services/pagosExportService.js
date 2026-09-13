/**
 * Servicio de exportación de auditoría de pagos a XLSX (Commit C).
 *
 * Genera archivo Excel con TODOS los pagos (vigentes + anulados) para
 * respaldo y auditoría del administrador. Decisión 2B: incluir ambos
 * estados para trazabilidad completa.
 *
 * Usa exceljs (misma dependencia que exportService de reportes) para
 * que abra directamente en Excel en macOS/Windows, sin depender de
 * la asociación de archivos del sistema.
 */
import ExcelJS from 'exceljs'
import { createLogger } from '../../../services/logger'

const log = createLogger('pagosExportService')

const COLUMNAS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Folio Comprobante', key: 'folioComprobante', width: 18 },
  { header: 'Folio DTE', key: 'folioDTE', width: 15 },
  { header: 'Fecha', key: 'fecha', width: 12 },
  { header: 'Hora', key: 'hora', width: 10 },
  { header: 'Paciente', key: 'pacienteNombre', width: 28 },
  { header: 'RUT', key: 'pacienteRut', width: 15 },
  { header: 'Monto (CLP)', key: 'monto', width: 14 },
  { header: 'Método de Pago', key: 'metodoPago', width: 18 },
  { header: 'Concepto', key: 'concepto', width: 25 },
  { header: 'Estado', key: 'estado', width: 12 },
  { header: 'Motivo Anulación', key: 'motivoAnulacion', width: 30 },
  { header: 'Fecha Anulación', key: 'fechaAnulacion', width: 15 },
  { header: 'Emitido por', key: 'emitidoPor', width: 22 },
  { header: 'Observación', key: 'observacion', width: 40 },
  { header: 'Motivo Purga', key: 'motivoPurga', width: 35 },
  { header: 'Fecha Purga', key: 'fechaPurga', width: 15 },
  { header: 'Purgado por', key: 'purgadoPor', width: 25 }
]

const generarTimestamp = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}

const estilizarEncabezado = (hoja) => {
  const fila = hoja.getRow(1)
  fila.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  fila.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2F5233' }
  }
  fila.alignment = { horizontal: 'center', vertical: 'middle' }
  fila.height = 22
}

const formatearFilas = (hoja) => {
  hoja.eachRow((fila, numFila) => {
    if (numFila === 1) return
    const estado = fila.getCell(11).value
    if (estado === 'Purgado') {
      fila.font = { color: { argb: 'FF4B5563' }, italic: true, strike: true }
      fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
    } else if (estado === 'Anulado') {
      fila.font = { color: { argb: 'FF991B1B' }, italic: true }
      fila.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEE2E2' }
      }
    }
    // Columna Monto con formato numérico
    const celdaMonto = fila.getCell(8)
    celdaMonto.numFmt = '$#,##0'
    celdaMonto.alignment = { horizontal: 'right' }
  })
}

/**
 * Exporta todos los pagos a XLSX y dispara la descarga del archivo.
 * @param {Array} pagos - Array de pagos (vigentes + anulados)
 * @returns {Promise<{ok: boolean, total: number, nombreArchivo: string}>}
 */
export const exportarAuditoriaPagosXLSX = async (pagos = []) => {
  try {
    if (!Array.isArray(pagos)) {
      log.error('exportarAuditoriaPagosXLSX: pagos no es array')
      return { ok: false, total: 0, nombreArchivo: '' }
    }
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Studio Dental'
    workbook.created = new Date()
    const hoja = workbook.addWorksheet('Auditoría Pagos')
    hoja.columns = COLUMNAS
    pagos.forEach(p => hoja.addRow(p))
    estilizarEncabezado(hoja)
    formatearFilas(hoja)
    // Auto-filtrar por encabezado
    hoja.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, pagos.length + 1), column: COLUMNAS.length }
    }
    const buffer = await workbook.xlsx.writeBuffer()
    const nombreArchivo = `auditoria_pagos_${generarTimestamp()}.xlsx`
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
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
    log.error('Error al exportar auditoría XLSX:', e)
    return { ok: false, total: 0, nombreArchivo: '' }
  }
}
