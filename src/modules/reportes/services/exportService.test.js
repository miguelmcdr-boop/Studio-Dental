/**
 * Tests de exportService (F6-05)
 * 
 * Valida las 4 funciones de exportación:
 * - exportarReportePDF: uso de window.print()
 * - exportarReporteCompletoExcel: 3 hojas (Resumen, Ranking, Rendimiento)
 * - exportarRankingExcel: solo ranking
 * - exportarRendimientoExcel: solo rendimiento
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as XLSX from 'xlsx'
import { registrarAuditoria } from '../../../services/conflictDetectionService'
import { 
  exportService,
  exportarReportePDF,
  exportarReporteCompletoExcel,
  exportarRankingExcel,
  exportarRendimientoExcel
} from './exportService'

// Mock de registrarAuditoria
vi.mock('../../../services/conflictDetectionService', () => ({
  registrarAuditoria: vi.fn()
}))

// Mock de xlsx
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({ sheets: {} })),
    aoa_to_sheet: vi.fn((data) => ({ data })),
    book_append_sheet: vi.fn((workbook, sheet, name) => {
      workbook.sheets[name] = sheet
    })
  },
  writeFile: vi.fn()
}))

// Mock de window.print
const mockPrint = vi.fn()
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true
})

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportarReportePDF', () => {
    it('llama a window.print() con métricas válidas', () => {
      const metricas = {
        totalRecaudado: 1000000,
        tasaConversionPresupuestos: 75
      }
      const userProfile = { nombreCompleto: 'Dr. Test' }

      const resultado = exportarReportePDF(metricas, userProfile)

      expect(resultado).toBe(true)
      expect(mockPrint).toHaveBeenCalled()
    })

    it('retorna false si ocurre un error', () => {
      mockPrint.mockImplementation(() => {
        throw new Error('Error de impresión')
      })

      const resultado = exportarReportePDF({}, {})

      expect(resultado).toBe(false)
    })
  })

  describe('exportarReporteCompletoExcel', () => {
    const metricasCompletas = {
      totalRecaudado: 2500000,
      tasaConversionPresupuestos: 80,
      ticketPromedio: 125000,
      topPrestaciones: [
        { nombre: 'Limpieza', cantidad: 10, montoTotal: 500000 },
        { nombre: 'Obturación', cantidad: 8, montoTotal: 400000 }
      ],
      recaudacionPorMetodo: {
        'Efectivo': 1000000,
        'Tarjeta': 1500000
      }
    }

    it('crea un workbook con 3 hojas', () => {
      const resultado = exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      expect(resultado).toBe(true)
      expect(XLSX.utils.book_new).toHaveBeenCalled()
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3)
      
      // Verificar nombres de hojas
      const workbook = XLSX.utils.book_new.mock.results[0].value
      expect(workbook.sheets).toHaveProperty('Resumen')
      expect(workbook.sheets).toHaveProperty('Top Prestaciones')
      expect(workbook.sheets).toHaveProperty('Rendimiento')
    })

    it('genera archivo con nombre que incluye período y timestamp', () => {
      exportarReporteCompletoExcel(metricasCompletas, 'ultimo_trimestre')

      expect(XLSX.writeFile).toHaveBeenCalled()
      const nombreArchivo = XLSX.writeFile.mock.calls[0][1]
      expect(nombreArchivo).toMatch(/^reporte-completo_ultimo_trimestre_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })

    it('formatea montos correctamente en la hoja Resumen', () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      const hojaResumen = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
      expect(hojaResumen).toContainEqual(['Recaudado Total (CLP)', '2.500.000'])
      expect(hojaResumen).toContainEqual(['Tasa de Conversión (%)', 80])
      expect(hojaResumen).toContainEqual(['Ticket Promedio (CLP)', '125.000'])
    })

    it('incluye todas las prestaciones en la hoja Ranking', () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      const hojaRanking = XLSX.utils.aoa_to_sheet.mock.calls[1][0]
      expect(hojaRanking).toContainEqual([1, 'Limpieza', 10, '500.000'])
      expect(hojaRanking).toContainEqual([2, 'Obturación', 8, '400.000'])
    })

    it('incluye todos los métodos de pago en la hoja Rendimiento', () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      const hojaRendimiento = XLSX.utils.aoa_to_sheet.mock.calls[2][0]
      expect(hojaRendimiento).toContainEqual(['Efectivo', '1.000.000'])
      expect(hojaRendimiento).toContainEqual(['Tarjeta', '1.500.000'])
    })

    it('maneja métricas vacías gracefully', () => {
      const metricasVacias = {
        totalRecaudado: 0,
        tasaConversionPresupuestos: 0,
        ticketPromedio: 0,
        topPrestaciones: [],
        recaudacionPorMetodo: {}
      }

      const resultado = exportarReporteCompletoExcel(metricasVacias, 'este_mes')

      expect(resultado).toBe(true)
      expect(XLSX.writeFile).toHaveBeenCalled()
    })

    it('retorna false si ocurre un error', () => {
      XLSX.utils.book_new.mockImplementation(() => {
        throw new Error('Error de xlsx')
      })

      const resultado = exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      expect(resultado).toBe(false)
    })
  })

  describe('exportarRankingExcel', () => {
    const topPrestaciones = [
      { nombre: 'Limpieza', cantidad: 10, montoTotal: 500000 },
      { nombre: 'Obturación', cantidad: 8, montoTotal: 400000 }
    ]

    it('crea un workbook con 1 hoja llamada Ranking', () => {
      const resultado = exportarRankingExcel(topPrestaciones)

      expect(resultado).toBe(true)
      expect(XLSX.utils.book_new).toHaveBeenCalled()
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(1)
      
      const workbook = XLSX.utils.book_new.mock.results[0].value
      expect(workbook.sheets).toHaveProperty('Ranking')
    })

    it('genera archivo con nombre ranking-prestaciones', () => {
      exportarRankingExcel(topPrestaciones)

      expect(XLSX.writeFile).toHaveBeenCalled()
      const nombreArchivo = XLSX.writeFile.mock.calls[0][1]
      expect(nombreArchivo).toMatch(/^ranking-prestaciones_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })

    it('retorna false si topPrestaciones está vacío', () => {
      const resultado = exportarRankingExcel([])

      expect(resultado).toBe(false)
      expect(XLSX.writeFile).not.toHaveBeenCalled()
    })

    it('retorna false si topPrestaciones es null', () => {
      const resultado = exportarRankingExcel(null)

      expect(resultado).toBe(false)
      expect(XLSX.writeFile).not.toHaveBeenCalled()
    })
  })

  describe('exportarRendimientoExcel', () => {
    const recaudacionPorMetodo = {
      'Efectivo': 1000000,
      'Tarjeta': 1500000,
      'Transferencia': 500000
    }

    it('crea un workbook con 1 hoja llamada Rendimiento', () => {
      const resultado = exportarRendimientoExcel(recaudacionPorMetodo)

      expect(resultado).toBe(true)
      expect(XLSX.utils.book_new).toHaveBeenCalled()
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(1)
      
      const workbook = XLSX.utils.book_new.mock.results[0].value
      expect(workbook.sheets).toHaveProperty('Rendimiento')
    })

    it('genera archivo con nombre rendimiento-metodos', () => {
      exportarRendimientoExcel(recaudacionPorMetodo)

      expect(XLSX.writeFile).toHaveBeenCalled()
      const nombreArchivo = XLSX.writeFile.mock.calls[0][1]
      expect(nombreArchivo).toMatch(/^rendimiento-metodos_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })

    it('incluye todos los métodos de pago', () => {
      exportarRendimientoExcel(recaudacionPorMetodo)

      const hojaRendimiento = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
      expect(hojaRendimiento).toContainEqual(['Efectivo', '1.000.000'])
      expect(hojaRendimiento).toContainEqual(['Tarjeta', '1.500.000'])
      expect(hojaRendimiento).toContainEqual(['Transferencia', '500.000'])
    })

    it('retorna false si recaudacionPorMetodo está vacío', () => {
      const resultado = exportarRendimientoExcel({})

      expect(resultado).toBe(false)
      expect(XLSX.writeFile).not.toHaveBeenCalled()
    })

    it('retorna false si recaudacionPorMetodo es null', () => {
      const resultado = exportarRendimientoExcel(null)

      expect(resultado).toBe(false)
      expect(XLSX.writeFile).not.toHaveBeenCalled()
    })
  })

  describe('exportService (objeto exportado)', () => {
    it('expone las 4 funciones correctamente', () => {
      expect(exportService).toHaveProperty('exportarReportePDF')
      expect(exportService).toHaveProperty('exportarReporteCompletoExcel')
      expect(exportService).toHaveProperty('exportarRankingExcel')
      expect(exportService).toHaveProperty('exportarRendimientoExcel')
      
      expect(typeof exportService.exportarReportePDF).toBe('function')
      expect(typeof exportService.exportarReporteCompletoExcel).toBe('function')
      expect(typeof exportService.exportarRankingExcel).toBe('function')
      expect(typeof exportService.exportarRendimientoExcel).toBe('function')
    })
  })

  describe('integración con audit_log', () => {
    const metricasCompletas = {
      totalRecaudado: 2500000,
      tasaConversionPresupuestos: 80,
      ticketPromedio: 125000,
      topPrestaciones: [
        { nombre: 'Limpieza', cantidad: 10, montoTotal: 500000 }
      ],
      recaudacionPorMetodo: {
        'Efectivo': 1000000,
        'Tarjeta': 1500000
      }
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('registrarAuditoria se llama al exportar PDF exitosamente', async () => {
      exportarReportePDF(metricasCompletas, { nombreCompleto: 'Dr. Test' })
      
      // Dar tiempo al fire-and-forget
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(registrarAuditoria).toHaveBeenCalledWith(
        'reportes',
        expect.stringMatching(/^export_/),
        'EXPORT',
        null,
        expect.objectContaining({
          formato: 'pdf',
          tipo: 'completo',
          periodo: null
        }),
        null
      )
    })

    it('registrarAuditoria se llama al exportar Excel completo con período', async () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(registrarAuditoria).toHaveBeenCalledWith(
        'reportes',
        expect.stringMatching(/^export_/),
        'EXPORT',
        null,
        expect.objectContaining({
          formato: 'excel',
          tipo: 'completo',
          periodo: 'este_mes'
        }),
        null
      )
    })

    it('registrarAuditoria se llama al exportar ranking', async () => {
      exportarRankingExcel(metricasCompletas.topPrestaciones)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(registrarAuditoria).toHaveBeenCalledWith(
        'reportes',
        expect.stringMatching(/^export_/),
        'EXPORT',
        null,
        expect.objectContaining({
          formato: 'excel',
          tipo: 'ranking'
        }),
        null
      )
    })

    it('registrarAuditoria se llama al exportar rendimiento', async () => {
      exportarRendimientoExcel(metricasCompletas.recaudacionPorMetodo)
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(registrarAuditoria).toHaveBeenCalledWith(
        'reportes',
        expect.stringMatching(/^export_/),
        'EXPORT',
        null,
        expect.objectContaining({
          formato: 'excel',
          tipo: 'rendimiento'
        }),
        null
      )
    })

    it('registrarAuditoria NO se llama si la exportación falla', async () => {
      XLSX.utils.book_new.mockImplementation(() => {
        throw new Error('Error de xlsx')
      })

      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(registrarAuditoria).not.toHaveBeenCalled()
    })

    it('registrarAuditoria NO se llama si los datos están vacíos', async () => {
      exportarRankingExcel([])
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(registrarAuditoria).not.toHaveBeenCalled()
    })
  })
})
