import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// vi.hoisted para que los mocks sean estables entre el módulo y el test
const {
  mockAddRow,
  mockGetRow,
  mockWriteBuffer,
  mockAddWorksheet
} = vi.hoisted(() => {
  const mockAddRow = vi.fn()
  const mockGetRow = vi.fn(() => ({
    font: {},
    fill: {},
    alignment: {},
    height: 0
  }))
  const mockWriteBuffer = vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3])))
  const mockAddWorksheet = vi.fn(() => ({
    columns: [],
    addRow: mockAddRow,
    getRow: mockGetRow,
    eachRow: vi.fn((cb) => {
      // Simular: 1 header + N filas de datos
      cb({ getCell: () => ({ value: 'Emitido', numFmt: '', alignment: {} }) }, 1)
    }),
    autoFilter: null
  }))
  return { mockAddRow, mockGetRow, mockWriteBuffer, mockAddWorksheet }
})

vi.mock('exceljs', () => {
  return {
    default: {
      Workbook: vi.fn(() => ({
        creator: '',
        created: null,
        addWorksheet: mockAddWorksheet,
        xlsx: { writeBuffer: mockWriteBuffer }
      }))
    },
    Workbook: vi.fn(() => ({
      creator: '',
      created: null,
      addWorksheet: mockAddWorksheet,
      xlsx: { writeBuffer: mockWriteBuffer }
    }))
  }
})

vi.mock('../../../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
  })
}))

import { exportarAuditoriaPagosXLSX } from './pagosExportService'

describe('pagosExportService (XLSX)', () => {
  let clickSpy

  beforeEach(() => {
    vi.clearAllMocks()
    clickSpy = vi.fn()
    global.URL.createObjectURL = vi.fn(() => 'blob:fake-url')
    global.URL.revokeObjectURL = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return { href: '', download: '', click: clickSpy }
      return {}
    })
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const pagos = [
    {
      id: 1, folioComprobante: 'REC-2026-001', folioDTE: 'BH-001',
      fecha: '11/09/2026', hora: '10:30', pacienteNombre: 'Juan Pérez',
      pacienteRut: '12.345.678-9', monto: 50000, metodoPago: 'Efectivo',
      concepto: 'Consulta', estado: 'Emitido', emitidoPor: 'Admin'
    },
    {
      id: 2, folioComprobante: 'REC-2026-002', fecha: '11/09/2026',
      pacienteNombre: 'Ana García', pacienteRut: '11.222.333-4',
      monto: 30000, metodoPago: 'Transferencia', concepto: 'Abono',
      estado: 'Anulado', motivoAnulacion: 'Error del cajero'
    }
  ]

  it('genera XLSX con todos los pagos (vigentes + anulados)', async () => {
    const result = await exportarAuditoriaPagosXLSX(pagos)
    expect(result.ok).toBe(true)
    expect(result.total).toBe(2)
    expect(result.nombreArchivo).toMatch(/^auditoria_pagos_.*\.xlsx$/)
    expect(mockAddWorksheet).toHaveBeenCalledWith('Auditoría Pagos')
    expect(mockAddRow).toHaveBeenCalledTimes(2)
    expect(mockWriteBuffer).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })

  it('retorna ok:false si pagos no es array', async () => {
    const result = await exportarAuditoriaPagosXLSX(null)
    expect(result.ok).toBe(false)
    expect(result.total).toBe(0)
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('exporta array vacío sin fallar', async () => {
    const result = await exportarAuditoriaPagosXLSX([])
    expect(result.ok).toBe(true)
    expect(result.total).toBe(0)
    expect(mockAddRow).not.toHaveBeenCalled()
  })

  it('usa MIME type correcto para XLSX', async () => {
    let blobType = null
    global.Blob = class {
      constructor(parts, opts) { blobType = opts.type }
    }
    await exportarAuditoriaPagosXLSX(pagos)
    expect(blobType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })

  it('aplica estilos al encabezado', async () => {
    await exportarAuditoriaPagosXLSX(pagos)
    // getRow(1) debe haber sido llamado para estilizar el encabezado
    expect(mockGetRow).toHaveBeenCalledWith(1)
  })
})
