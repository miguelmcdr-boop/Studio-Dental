/**
 * Tests de exportService (F6-05, migrado a exceljs en F7-15, auditoría vía RPC en F7-19)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExcelJS from 'exceljs'
import {
  exportService,
  exportarReportePDF,
  exportarReporteCompletoExcel,
  exportarRankingExcel,
  exportarRendimientoExcel
} from './exportService'
import { supabase } from '../../../services/supabaseClient'

// Mock de supabase
vi.mock('../../../services/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn()
  },
  USE_SUPABASE: true
}))

// Mock de conflictDetectionService (ya no se usa directamente)
vi.mock('../../../services/conflictDetectionService', () => ({
  registrarAuditoria: vi.fn()
}))

// Factory de worksheet mock
const createMockWorksheet = () => ({
  addRows: vi.fn(),
  getRow: vi.fn(() => ({
    font: {},
    fill: {},
    alignment: {}
  }))
})

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
  const WorkbookMock = vi.fn(() => {
    currentMockWorkbook = createMockWorkbook()
    return currentMockWorkbook
  })
  return {
    default: { Workbook: WorkbookMock },
    Workbook: WorkbookMock
  }
})

// Mock de window.print
const mockPrint = vi.fn()
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true
})

// Mock del DOM
const mockLink = {
  href: '',
  download: '',
  click: vi.fn()
}

beforeEach(() => {
  vi.clearAllMocks()
  supabase.rpc.mockResolvedValue({ data: 'test-uuid', error: null })
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'a') return mockLink
    return { appendChild: vi.fn(), removeChild: vi.fn() }
  })
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
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

    it('registra en audit_log vía RPC (F7-19)', async () => {
      exportarReportePDF({ totalRecaudado: 1000 }, {})
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(supabase.rpc).toHaveBeenCalledWith('registrar_exportacion', {
        p_formato: 'pdf',
        p_tipo: 'completo',
        p_periodo: 'sin_periodo'
      })
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
      const rows = hojaResumen.addRows.mock.calls[0][0]
      expect(rows).toContainEqual(['Recaudado Total (CLP)', '2.500.000'])
      expect(rows).toContainEqual(['Tasa de Conversión (%)', 80])
      expect(rows).toContainEqual(['Ticket Promedio (CLP)', '125.000'])
    })

    it('incluye todas las prestaciones en la hoja Ranking', async () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')
      await new Promise(resolve => setTimeout(resolve, 10))

      const hojaRanking = currentMockWorkbook._worksheets[1]
      const rows = hojaRanking.addRows.mock.calls[0][0]
      expect(rows).toContainEqual([1, 'Limpieza', 10, '500.000'])
      expect(rows).toContainEqual([2, 'Obturación', 8, '400.000'])
    })

    it('incluye todos los métodos de pago en la hoja Rendimiento', async () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')
      await new Promise(resolve => setTimeout(resolve, 10))

      const hojaRendimiento = currentMockWorkbook._worksheets[2]
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

    it('registra en audit_log vía RPC (F7-19)', async () => {
      exportarReporteCompletoExcel(metricasCompletas, 'este_mes')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(supabase.rpc).toHaveBeenCalledWith('registrar_exportacion', {
        p_formato: 'excel',
        p_tipo: 'completo',
        p_periodo: 'este_mes'
      })
    })

    it('manejando error async en RPC no rompe la descarga', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: { message: 'RATE_LIMIT' } })

      const resultado = exportarReporteCompletoExcel(metricasCompletas, 'este_mes')

      expect(resultado).toBe(true)
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(mockLink.click).toHaveBeenCalled()
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

      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledTimes(1)
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledWith('Ranking')
    })

    it('genera archivo con nombre ranking-prestaciones', async () => {
      exportarRankingExcel(topPrestaciones)
      await new Promise(resolve => setTimeout(resolve, 10))

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

    it('registra en audit_log vía RPC (F7-19)', async () => {
      exportarRankingExcel(topPrestaciones)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(supabase.rpc).toHaveBeenCalledWith('registrar_exportacion', {
        p_formato: 'excel',
        p_tipo: 'ranking',
        p_periodo: 'sin_periodo'
      })
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

      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledTimes(1)
      expect(currentMockWorkbook.addWorksheet).toHaveBeenCalledWith('Rendimiento')
    })

    it('genera archivo con nombre rendimiento-metodos', async () => {
      exportarRendimientoExcel(recaudacionPorMetodo)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockLink.download).toMatch(/^rendimiento-metodos_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/)
    })

    it('incluye todos los métodos de pago', async () => {
      exportarRendimientoExcel(recaudacionPorMetodo)
      await new Promise(resolve => setTimeout(resolve, 10))

      const hojaRendimiento = currentMockWorkbook._worksheets[0]
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

    it('registra en audit_log vía RPC (F7-19)', async () => {
      exportarRendimientoExcel(recaudacionPorMetodo)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(supabase.rpc).toHaveBeenCalledWith('registrar_exportacion', {
        p_formato: 'excel',
        p_tipo: 'rendimiento',
        p_periodo: 'sin_periodo'
      })
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
})
