/**
 * Servicio centralizado de exportación de reportes (F6-05).
 * Migrado de xlsx a exceljs (F7-15) por vulnerabilidades de seguridad.
 *
 * API pública:
 * - exportarReportePDF(metricas, userProfile) → genera PDF vía window.print()
 * - exportarReporteCompletoExcel(metricas) → Excel con 3 hojas
 * - exportarRankingExcel(topPrestaciones) → Excel con ranking de prestaciones
 * - exportarRendimientoExcel(recaudacionPorMetodo) → Excel con desglose por método
 *
 * Características:
 * - PDF: reutiliza window.print() con vista previa Letter
 * - Excel: usa exceljs (async) con múltiples hojas
 * - Nombres de archivo incluyen timestamp para evitar colisiones
 * - Integración con audit_log para trazabilidad (F6-F)
 * - Descarga vía Blob + URL.createObjectURL (compatible con exceljs)
 */
import ExcelJS from 'exceljs'
import { createLogger } from '../../../services/logger'
import { registrarAuditoria } from '../../../services/conflictDetectionService'

const log = createLogger('exportService')

/**
 * Genera un nombre de archivo con timestamp.
 * @param {string} prefijo - Prefijo del archivo (ej: 'reporte-completo')
 * @param {string} extension - Extensión del archivo (ej: 'xlsx', 'pdf')
 * @returns {string} Nombre de archivo con formato: prefijo_YYYY-MM-DDTHH-MM-SS.extension
 */
const generarNombreArchivo = (prefijo, extension) => {
  const fecha = new Date()
  const timestamp = fecha.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${prefijo}_${timestamp}.${extension}`
}

/**
 * Formatea un monto en CLP para exportación.
 * @param {number} monto - Monto a formatear
 * @returns {string} Monto formateado como string (sin símbolo $)
 */
const formatearMonto = (monto) => {
  return monto?.toLocaleString('es-CL') || '0'
}

/**
 * Descarga un buffer como archivo .xlsx en el navegador.
 * @param {ArrayBuffer} buffer - Buffer del archivo Excel
 * @param {string} nombreArchivo - Nombre del archivo a descargar
 */
const descargarBuffer = (buffer, nombreArchivo) => {
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
}

/**
 * Aplica estilos a una fila de encabezado en una hoja de Excel.
 * @param {ExcelJS.Worksheet} hoja - Hoja de Excel
 * @param {number} numeroFila - Número de fila (1-based)
 */
const estilizarEncabezado = (hoja, numeroFila) => {
  const fila = hoja.getRow(numeroFila)
  fila.font = { bold: true }
  fila.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  }
  fila.alignment = { horizontal: 'center' }
}

/**
 * Registra una exportación en audit_log (fire-and-forget, no bloquea).
 * @param {string} formato - 'pdf' o 'excel'
 * @param {string} tipo - 'completo', 'ranking' o 'rendimiento'
 * @param {string} periodo - Período del reporte (opcional)
 */
const registrarExportacion = (formato, tipo, periodo = null) => {
  try {
    registrarAuditoria(
      'reportes',
      `export_${Date.now()}`,
      'EXPORT',
      null,
      {
        formato,
        tipo,
        periodo,
        timestamp: new Date().toISOString()
      },
      null
    )
  } catch (error) {
    log.warn('No se pudo registrar auditoría de exportación:', error.message)
  }
}

/**
 * Exporta el reporte completo como PDF usando window.print().
 * Nota: Este método requiere que el componente ReporteImprimibleLetter esté visible.
 *
 * @param {Object} metricas - Métricas del período
 * @param {Object} userProfile - Perfil del usuario
 * @returns {boolean} true si se inició la impresión, false en caso de error
 */
export const exportarReportePDF = (metricas, userProfile) => {
  try {
    log.info('Exportando reporte PDF', {
      totalRecaudado: metricas.totalRecaudado,
      tasaConversion: metricas.tasaConversionPresupuestos
    })

    window.print()

    log.info('Diálogo de impresión abierto')
    registrarExportacion('pdf', 'completo')
    return true
  } catch (error) {
    log.error('Error al exportar PDF:', error)
    return false
  }
}

/**
 * Genera async el reporte completo con 3 hojas (Resumen, Top Prestaciones, Rendimiento).
 * @param {Object} metricas - Métricas del período
 * @param {string} periodoSeleccionado - Período del reporte
 */
const generarReporteCompletoAsync = async (metricas, periodoSeleccionado) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Studio Dental'
  workbook.created = new Date()

  // Hoja 1: Resumen ejecutivo
  const hojaResumen = workbook.addWorksheet('Resumen')
  hojaResumen.addRows([
    ['Informe de Gestión Clínica y Financiera'],
    ['Período:', periodoSeleccionado],
    ['Fecha de Exportación:', new Date().toLocaleString('es-CL')],
    [],
    ['Métrica', 'Valor'],
    ['Recaudado Total (CLP)', formatearMonto(metricas.totalRecaudado)],
    ['Tasa de Conversión (%)', metricas.tasaConversionPresupuestos],
    ['Ticket Promedio (CLP)', formatearMonto(metricas.ticketPromedio)],
  ])
  estilizarEncabezado(hojaResumen, 5)

  // Hoja 2: Top prestaciones
  const hojaRanking = workbook.addWorksheet('Top Prestaciones')
  const rankingRows = [
    ['Top Procedimientos más Rentables'],
    [],
    ['Posición', 'Procedimiento', 'Cantidad', 'Monto Total (CLP)'],
  ]
  metricas.topPrestaciones.forEach((item, index) => {
    rankingRows.push([
      index + 1,
      item.nombre,
      item.cantidad,
      formatearMonto(item.montoTotal)
    ])
  })
  hojaRanking.addRows(rankingRows)
  estilizarEncabezado(hojaRanking, 3)

  // Hoja 3: Rendimiento por método de pago
  const hojaRendimiento = workbook.addWorksheet('Rendimiento')
  const rendimientoRows = [
    ['Desglose por Medio de Pago'],
    [],
    ['Método de Pago', 'Monto (CLP)'],
  ]
  Object.entries(metricas.recaudacionPorMetodo || {}).forEach(([metodo, monto]) => {
    rendimientoRows.push([metodo, formatearMonto(monto)])
  })
  hojaRendimiento.addRows(rendimientoRows)
  estilizarEncabezado(hojaRendimiento, 3)

  const buffer = await workbook.xlsx.writeBuffer()
  const nombreArchivo = generarNombreArchivo(`reporte-completo_${periodoSeleccionado}`, 'xlsx')
  descargarBuffer(buffer, nombreArchivo)
  log.info('Reporte completo exportado', { archivo: nombreArchivo })
}

/**
 * Exporta el reporte completo como Excel con 3 hojas.
 * API síncrona: retorna true si la exportación se inició correctamente.
 * La descarga real ocurre asincrónicamente (fire-and-forget).
 *
 * @param {Object} metricas - Métricas del período
 * @param {string} periodoSeleccionado - Período del reporte
 * @returns {boolean} true si se exportó correctamente, false en caso de error
 */
export const exportarReporteCompletoExcel = (metricas, periodoSeleccionado = 'sin_periodo') => {
  try {
    log.info('Exportando reporte completo Excel', { periodo: periodoSeleccionado })

    generarReporteCompletoAsync(metricas, periodoSeleccionado).catch(error => {
      log.error('Error en generación async de reporte completo:', error)
    })

    registrarExportacion('excel', 'completo', periodoSeleccionado)
    return true
  } catch (error) {
    log.error('Error al exportar reporte completo:', error)
    return false
  }
}

/**
 * Genera async el ranking de prestaciones en una sola hoja.
 * @param {Array} topPrestaciones - Array de prestaciones
 */
const generarRankingAsync = async (topPrestaciones) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Studio Dental'
  workbook.created = new Date()

  const hoja = workbook.addWorksheet('Ranking')
  const rows = [
    ['Top Procedimientos más Rentables'],
    ['Fecha de Exportación:', new Date().toLocaleString('es-CL')],
    [],
    ['Posición', 'Procedimiento', 'Cantidad', 'Monto Total (CLP)'],
  ]
  topPrestaciones.forEach((item, index) => {
    rows.push([
      index + 1,
      item.nombre,
      item.cantidad,
      formatearMonto(item.montoTotal)
    ])
  })
  hoja.addRows(rows)
  estilizarEncabezado(hoja, 4)

  const buffer = await workbook.xlsx.writeBuffer()
  const nombreArchivo = generarNombreArchivo('ranking-prestaciones', 'xlsx')
  descargarBuffer(buffer, nombreArchivo)
  log.info('Ranking exportado', { archivo: nombreArchivo })
}

/**
 * Exporta solo el ranking de prestaciones como Excel.
 * API síncrona: retorna true si la exportación se inició correctamente.
 *
 * @param {Array} topPrestaciones - Array de prestaciones con nombre, cantidad, montoTotal
 * @returns {boolean} true si se exportó correctamente, false en caso de error
 */
export const exportarRankingExcel = (topPrestaciones) => {
  try {
    log.info('Exportando ranking de prestaciones', { cantidad: topPrestaciones?.length })

    if (!topPrestaciones || topPrestaciones.length === 0) {
      log.warn('No hay prestaciones para exportar')
      return false
    }

    generarRankingAsync(topPrestaciones).catch(error => {
      log.error('Error en generación async de ranking:', error)
    })

    registrarExportacion('excel', 'ranking')
    return true
  } catch (error) {
    log.error('Error al exportar ranking:', error)
    return false
  }
}

/**
 * Genera async el desglose por método de pago en una sola hoja.
 * @param {Object} recaudacionPorMetodo - Objeto con método -> monto
 */
const generarRendimientoAsync = async (recaudacionPorMetodo) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Studio Dental'
  workbook.created = new Date()

  const hoja = workbook.addWorksheet('Rendimiento')
  const rows = [
    ['Desglose por Medio de Pago'],
    ['Fecha de Exportación:', new Date().toLocaleString('es-CL')],
    [],
    ['Método de Pago', 'Monto (CLP)'],
  ]
  Object.entries(recaudacionPorMetodo).forEach(([metodo, monto]) => {
    rows.push([metodo, formatearMonto(monto)])
  })
  hoja.addRows(rows)
  estilizarEncabezado(hoja, 4)

  const buffer = await workbook.xlsx.writeBuffer()
  const nombreArchivo = generarNombreArchivo('rendimiento-metodos', 'xlsx')
  descargarBuffer(buffer, nombreArchivo)
  log.info('Rendimiento exportado', { archivo: nombreArchivo })
}

/**
 * Exporta solo el desglose por método de pago como Excel.
 * API síncrona: retorna true si la exportación se inició correctamente.
 *
 * @param {Object} recaudacionPorMetodo - Objeto con método -> monto
 * @returns {boolean} true si se exportó correctamente, false en caso de error
 */
export const exportarRendimientoExcel = (recaudacionPorMetodo) => {
  try {
    log.info('Exportando rendimiento por método de pago')

    if (!recaudacionPorMetodo || Object.keys(recaudacionPorMetodo).length === 0) {
      log.warn('No hay datos de rendimiento para exportar')
      return false
    }

    generarRendimientoAsync(recaudacionPorMetodo).catch(error => {
      log.error('Error en generación async de rendimiento:', error)
    })

    registrarExportacion('excel', 'rendimiento')
    return true
  } catch (error) {
    log.error('Error al exportar rendimiento:', error)
    return false
  }
}

// Exportar todas las funciones como objeto para facilitar el uso
export const exportService = {
  exportarReportePDF,
  exportarReporteCompletoExcel,
  exportarRankingExcel,
  exportarRendimientoExcel
}
