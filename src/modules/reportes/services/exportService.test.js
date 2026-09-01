/**
 * Tests de exportService (F6-05, migrado a exceljs en F7-15)
 *
 * Valida las 4 funciones de exportación:
 * - exportarReportePDF: uso de window.print()
 * - exportarReporteCompletoExcel: 3 hojas (Resumen, Ranking, Rendimiento)
 * - exportarRankingExcel: solo ranking
 * - exportarRendimientoExcel: solo rendimiento
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExcelJS from 'exceljs'
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

// Factory de worksheet mock (un objeto nuevo por cada addWorksheet)
const createMockWorksheet = () => ({
  addRows: vi.fn(),
  getRow: vi.fn(() => ({
    font: {},
    fill: {},
    alignment: {}
  }))
})

// Mock de exceljs: Workbook retorna un objeto con addWorksheet que devuelve worksheet nuevo cada vez
const createMockWorkbook = () => {
  const worksheets = []
  return {
    creator: '',
    created: null,
    addWorksheet: vi.fn((name) => {
      const ws = createMockWorksheet()
      ws._name = name
      worksheets.push(ws)
      return ws
    }),
    xlsx: {
      writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    },
    _worksheets: worksheets
  }
}

let currentMockWorkbook = null

vi.mock('exceljs', () => {
  return {
    default: {
      Workbook: vi.fn(() => {
        currentMockWorkbook = createMockWorkbook()
        return currentMockWorkbook
      })
    },
    Workbook: vi.fn(() => {
      currentMockWorkbook = createMockWorkbook()
      return currentMockWorkbook
    })
  }
})

// Mock de window.print
const mockPrint = vi.fn()
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true
})

// Mock del DOM para descarga de archivo
const mockLink = {
  href: '',
  download: '',
  click: vi.fn()
}

let createMockLink = false

beforeEach(() => {
  vi.clearAllMocks()
  createMockLink = true

  // Mock de document.createElement para retornar mockLink cuando es <a>
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'a') return mockLink
    // Para otros elementos, crear un div genérico
    return { appendChild: vi.fn(), removeChild: vi.fn() }
  })

  // Mock de document.body.appendChild y removeChild
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})

  // Mock de Blob y URL
  global.Blob = vi.fn((data, options) => ({ data, options }))
  global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test')
  global.URL.revokeObjectURL = vi.fn()
})

describe('exportService', () => {
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

    it('crea un workbook con 3 hojas', async () => {
      const resultado = exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      expect(resultado).toBe(true)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(ExcelJS.Workbook).toHaveBeenCalled()
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledTimes(3)
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledWith('Resumen')
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledWith('Top Prestaciones')
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledWith('Rendimiento')
    })

    it('genera archivo con nombre que incluye período y timestamp', async () => {
      exportarReporteCompletoExcel(metricasCompletas, 'ultimo_trimestre')

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toMatch(/^reporte-completo_ultimo_trimestre_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })

    it('formatea montos correctamente en la hoja Resumen', async () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      await new Promise(resolve => setTimeout(resolve, 10))

      const hojaResumen = currentMockWorkbook._worksheets[0]
      expect(hojaResumen._name).toBe('Resumen')
      expect(hojaResumen.addRows).toHaveBeenCalled()

      const rows = hojaResumen.addRows.mock.calls[0][0]
      expect(rows).toContainEqual(['Recaudado Total (CLP)', '2.500.000'])
      expect(rows).toContainEqual(['Tasa de Conversión (%)', 80])
      expect(rows).toContainEqual(['Ticket Promedio (CLP)', '125.000'])
    })

    it('incluye todas las prestaciones en la hoja Ranking', async () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      await new Promise(resolve => setTimeout(resolve, 10))

      const hojaRanking = currentMockWorkbook._worksheets[1]
      expect(hojaRanking._name).toBe('Top Prestaciones')
      const rows = hojaRanking.addRows.mock.calls[0][0]
      expect(rows).toContainEqual([1, 'Limpieza', 10, '500.000'])
      expect(rows).toContainEqual([2, 'Obturación', 8, '400.000'])
    })

    it('incluye todos los métodos de pago en la hoja Rendimiento', async () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      await new Promise(resolve => setTimeout(resolve, 10))

      const hojaRendimiento = currentMockWorkbook._worksheets[2]
      expect(hojaRendimiento._name).toBe('Rendimiento')
      const rows = hojaRendimiento.addRows.mock.calls[0][0]
      expect(rows).toContainEqual(['Efectivo', '1.000.000'])
      expect(rows).toContainEqual(['Tarjeta', '1.500.000'])
    })

    it('maneja métricas vacías sin errores', async () => {
      const metricasVacias = {
        totalRecaudado: 0,
        tasaConversionPresupuestos: 0,
        ticketPromedio: 0,
        topPrestaciones: [],
        recaudacionPorMetodo: {}
      }

      const resultado = exportarReporteCompletoExcel(metricasVacias, 'este_mes')

      expect(resultado).toBe(true)
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('retorna true y logea error async si writeBuffer falla', async () => {
      // En exceljs el Workbook constructor no falla síncronamente.
      // El error ocurre async en writeBuffer(). La API pública retorna true
      // (indica que se inició la exportación) y el error se logea async.
      const mockWb = createMockWorkbook()
      mockWb.xlsx.writeBuffer.mockRejectedValue(new Error('Error de exceljs'))
      ExcelJS.Workbook.mockImplementation(() => mockWb)

      const resultado = exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      // Retorna true porque la llamada síncrona fue exitosa
      expect(resultado).toBe(true)

      // Esperar a que el async se resuelva
      await new Promise(resolve => setTimeout(resolve, 10))

      // El link NO debe ser clickeado porque falló la generación
      expect(mockLink.click).not.toHaveBeenCalled()
    })
  })

  describe('exportarRankingExcel', () => {
    const topPrestaciones = [
      { nombre: 'Limpieza', cantidad: 10, montoTotal: 500000 },
      { nombre: 'Obturación', cantidad: 8, montoTotal: 400000 }
    ]

    it('crea un workbook con 1 hoja llamada Ranking', async () => {
      const resultado = exportarRankingExcel(topPrestaciones)

      expect(resultado).toBe(true)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(ExcelJS.Workbook).toHaveBeenCalled()
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledTimes(1)
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledWith('Ranking')
    })

    it('genera archivo con nombre ranking-prestaciones', async () => {
      exportarRankingExcel(topPrestaciones)

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toMatch(/^ranking-prestaciones_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })

    it('retorna false si topPrestaciones está vacío', () => {
      const resultado = exportarRankingExcel([])

      expect(resultado).toBe(false)
      expect(mockLink.click).not.toHaveBeenCalled()
    })

    it('retorna false si topPrestaciones es null', () => {
      const resultado = exportarRankingExcel(null)

      expect(resultado).toBe(false)
      expect(mockLink.click).not.toHaveBeenCalled()
    })
  })

  describe('exportarRendimientoExcel', () => {
    const recaudacionPorMetodo = {
      'Efectivo': 1000000,
      'Tarjeta': 1500000,
      'Transferencia': 500000
    }

    it('crea un workbook con 1 hoja llamada Rendimiento', async () => {
      const resultado = exportarRendimientoExcel(recaudacionPorMetodo)

      expect(resultado).toBe(true)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(ExcelJS.Workbook).toHaveBeenCalled()
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledTimes(1)
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledWith('Rendimiento')
    })

    it('genera archivo con nombre rendimiento-metodos', async () => {
      exportarRendimientoExcel(recaudacionPorMetodo)

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toMatch(/^rendimiento-metodos_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })

    it('incluye todos los métodos de pago', async () => {
      exportarRendimientoExcel(recaudacionPorMetodo)

      await new Promise(resolve => setTimeout(resolve, 10))

      const hojaRendimiento = currentMockWorkbook._worksheets[0]
      expect(hojaRendimiento.addRows).toHaveBeenCalled()

      const rows = hojaRendimiento.addRows.mock.calls[0][0]
      expect(rows).toContainEqual(['Efectivo', '1.000.000'])
      expect(rows).toContainEqual(['Tarjeta', '1.500.000'])
      expect(rows).toContainEqual(['Transferencia', '500.000'])
    })

    it('retorna false si recaudacionPorMetodo está vacío', () => {
      const resultado = exportarRendimientoExcel({})

      expect(resultado).toBe(false)
      expect(mockLink.click).not.toHaveBeenCalled()
    })

    it('retorna false si recaudacionPorMetodo es null', () => {
      const resultado = exportarRendimientoExcel(null)

      expect(resultado).toBe(false)
      expect(mockLink.click).not.toHaveBeenCalled()
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
        'Efectivo': 1000000
      }
    }

    it('registrarAuditoria se llama al exportar PDF', async () => {
      exportarReportePDF(metricasCompletas, {})

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(registrarAuditoria).toHaveBeenCalledWith(
        'reportes',
        expect.stringMatching(/^export_/),
        'EXPORT',
        null,
        expect.objectContaining({ formato: 'pdf', tipo: 'completo' }),
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
        expect.objectContaining({ formato: 'excel', tipo: 'completo', periodo: 'este_mes' }),
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
        expect.objectContaining({ formato: 'excel', tipo: 'ranking' }),
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
        expect.objectContaining({ formato: 'excel', tipo: 'rendimiento' }),
        null
      )
    })

    it('registrarAuditoria se llama síncronamente aunque async falle', async () => {
      // La auditoría registra el INTENTO de exportar, aunque luego falle la descarga
      const mockWb = createMockWorkbook()
      mockWb.xlsx.writeBuffer.mockRejectedValue(new Error('Error async'))
      ExcelJS.Workbook.mockImplementation(() => mockWb)

      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      // La auditoría se registra síncronamente
      expect(registrarAuditoria).toHaveBeenCalledWith(
        'reportes',
        expect.stringMatching(/^export_/),
        'EXPORT',
        null,
        expect.objectContaining({ formato: 'excel', tipo: 'completo', periodo: 'este_mes' }),
        null
      )
    })

    it('registrarAuditoria NO se llama si los datos están vacíos', async () => {
      exportarRankingExcel([])

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(registrarAuditoria).not.toHaveBeenCalled()
    })
  })
})
