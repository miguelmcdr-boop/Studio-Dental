/**
 * Servicio centralizado de exportación de reportes (F6-05).
 *
 * API pública:
 * - exportarReportePDF(metricas, userProfile) → genera PDF vía window.print()
 * - exportarReporteCompletoExcel(metricas) → Excel con 3 hojas
 * - exportarRankingExcel(topPrestaciones) → Excel con ranking de prestaciones
 * - exportarRendimientoExcel(recaudacionPorMetodo) → Excel con desglose por método
 *
 * Características:
 * - PDF: reutiliza window.print() con vista previa Letter
 * - Excel: usa xlsx (SheetJS) con múltiples hojas
 * - Nombres de archivo incluyen timestamp para evitar colisiones
 * - Integración con audit_log para trazabilidad (F6-F)
 */
import * as XLSX from 'xlsx'
import { createLogger } from '../../../services/logger'
import { registrarAuditoria } from '../../../services/conflictDetectionService'

const log = createLogger('exportService')

/**
 * Genera un nombre de archivo con timestamp.
 * @param {string} prefijo - Prefijo del archivo (ej: 'reporte-completo')
 * @param {string} extension - Extensión del archivo (ej: 'xlsx', 'pdf')
 * @returns {string} Nombre de archivo con formato: prefijo_YYYY-MM-DD_HH-MM-SS.extension
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
 * Exporta el reporte completo como PDF usando window.print().
 * Nota: Este método requiere que el componente ReporteImprimibleLetter esté visible.
 * 
 * @param {Object} metricas - Métricas del período
 * @param {Object} userProfile - Perfil del usuario
 * @returns {boolean} true si se inició la impresión, false en caso de error
 */

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
    // No debe ocurrir, pero si pasa no rompe el flujo de exportación
    log.warn('No se pudo registrar auditoría de exportación:', error.message)
  }
}

export const exportarReportePDF = (metricas, userProfile) => {
  try {
    log.info('Exportando reporte PDF', { 
      totalRecaudado: metricas.totalRecaudado,
      tasaConversion: metricas.tasaConversionPresupuestos 
    })
    
    // window.print() abre el diálogo de impresión del navegador
    // El usuario puede guardar como PDF desde ahí
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
 * Exporta el reporte completo como Excel con 3 hojas.
 * 
 * @param {Object} metricas - Métricas del período
 * @param {Object} metricas.totalRecaudado - Total recaudado
 * @param {Object} metricas.tasaConversionPresupuestos - Tasa de conversión
 * @param {Object} metricas.ticketPromedio - Ticket promedio
 * @param {Array} metricas.topPrestaciones - Top prestaciones
 * @param {Object} metricas.recaudacionPorMetodo - Desglose por método de pago
 * @param {string} periodoSeleccionado - Período del reporte
 * @returns {boolean} true si se exportó correctamente, false en caso de error
 */
export const exportarReporteCompletoExcel = (metricas, periodoSeleccionado = 'sin_periodo') => {
  try {
    log.info('Exportando reporte completo Excel', { periodo: periodoSeleccionado })
    
    const workbook = XLSX.utils.book_new()
    
    // Hoja 1: Resumen ejecutivo
    const resumenData = [
      ['Informe de Gestión Clínica y Financiera'],
      ['Período:', periodoSeleccionado],
      ['Fecha de Exportación:', new Date().toLocaleString('es-CL')],
      [],
      ['Métrica', 'Valor'],
      ['Recaudado Total (CLP)', formatearMonto(metricas.totalRecaudado)],
      ['Tasa de Conversión (%)', metricas.tasaConversionPresupuestos],
      ['Ticket Promedio (CLP)', formatearMonto(metricas.ticketPromedio)],
    ]
    const hojaResumen = XLSX.utils.aoa_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(workbook, hojaResumen, 'Resumen')
    
    // Hoja 2: Top prestaciones
    const rankingData = [
      ['Top Procedimientos más Rentables'],
      [],
      ['Posición', 'Procedimiento', 'Cantidad', 'Monto Total (CLP)'],
    ]
    
    metricas.topPrestaciones.forEach((item, index) => {
      rankingData.push([
        index + 1,
        item.nombre,
        item.cantidad,
        formatearMonto(item.montoTotal)
      ])
    })
    
    const hojaRanking = XLSX.utils.aoa_to_sheet(rankingData)
    XLSX.utils.book_append_sheet(workbook, hojaRanking, 'Top Prestaciones')
    
    // Hoja 3: Rendimiento por método de pago
    const rendimientoData = [
      ['Desglose por Medio de Pago'],
      [],
      ['Método de Pago', 'Monto (CLP)'],
    ]
    
    Object.entries(metricas.recaudacionPorMetodo || {}).forEach(([metodo, monto]) => {
      rendimientoData.push([metodo, formatearMonto(monto)])
    })
    
    const hojaRendimiento = XLSX.utils.aoa_to_sheet(rendimientoData)
    XLSX.utils.book_append_sheet(workbook, hojaRendimiento, 'Rendimiento')
    
    // Generar y descargar archivo
    const nombreArchivo = generarNombreArchivo(`reporte-completo_${periodoSeleccionado}`, 'xlsx')
    XLSX.writeFile(workbook, nombreArchivo)
    
    log.info('Reporte completo exportado', { archivo: nombreArchivo })
    registrarExportacion('excel', 'completo', periodoSeleccionado)
    return true
  } catch (error) {
    log.error('Error al exportar reporte completo:', error)
    return false
  }
}

/**
 * Exporta solo el ranking de prestaciones como Excel.
 * 
 * @param {Array} topPrestaciones - Array de prestaciones con nombre, cantidad, montoTotal
 * @returns {boolean} true si se exportó correctamente, false en caso de error
 */
export const exportarRankingExcel = (topPrestaciones) => {
  try {
    log.info('Exportando ranking de prestaciones', { cantidad: topPrestaciones.length })
    
    if (!topPrestaciones || topPrestaciones.length === 0) {
      log.warn('No hay prestaciones para exportar')
      return false
    }
    
    const workbook = XLSX.utils.book_new()
    
    const rankingData = [
      ['Top Procedimientos más Rentables'],
      ['Fecha de Exportación:', new Date().toLocaleString('es-CL')],
      [],
      ['Posición', 'Procedimiento', 'Cantidad', 'Monto Total (CLP)'],
    ]
    
    topPrestaciones.forEach((item, index) => {
      rankingData.push([
        index + 1,
        item.nombre,
        item.cantidad,
        formatearMonto(item.montoTotal)
      ])
    })
    
    const hojaRanking = XLSX.utils.aoa_to_sheet(rankingData)
    XLSX.utils.book_append_sheet(workbook, hojaRanking, 'Ranking')
    
    const nombreArchivo = generarNombreArchivo('ranking-prestaciones', 'xlsx')
    XLSX.writeFile(workbook, nombreArchivo)
    
    log.info('Ranking exportado', { archivo: nombreArchivo })
    registrarExportacion('excel', 'ranking')
    return true
  } catch (error) {
    log.error('Error al exportar ranking:', error)
    return false
  }
}

/**
 * Exporta solo el desglose por método de pago como Excel.
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
    
    const workbook = XLSX.utils.book_new()
    
    const rendimientoData = [
      ['Desglose por Medio de Pago'],
      ['Fecha de Exportación:', new Date().toLocaleString('es-CL')],
      [],
      ['Método de Pago', 'Monto (CLP)'],
    ]
    
    Object.entries(recaudacionPorMetodo).forEach(([metodo, monto]) => {
      rendimientoData.push([metodo, formatearMonto(monto)])
    })
    
    const hojaRendimiento = XLSX.utils.aoa_to_sheet(rendimientoData)
    XLSX.utils.book_append_sheet(workbook, hojaRendimiento, 'Rendimiento')
    
    const nombreArchivo = generarNombreArchivo('rendimiento-metodos', 'xlsx')
    XLSX.writeFile(workbook, nombreArchivo)
    
    log.info('Rendimiento exportado', { archivo: nombreArchivo })
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
