import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportarAuditoriaPagosCSV } from './pagosExportService'

vi.mock('../../../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

describe('pagosExportService', () => {
  let clickSpy
  let appendChildSpy
  let removeChildSpy
  let blobCalls

  beforeEach(() => {
    clickSpy = vi.fn()
    appendChildSpy = vi.fn()
    removeChildSpy = vi.fn()
    blobCalls = []

    // Mock URL.createObjectURL / revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:fake-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock Blob para capturar contenido del CSV
    global.Blob = class {
      constructor(parts, opts) {
        blobCalls.push({ parts, opts })
      }
    }

    // Mock document.createElement + body methods
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy }
      }
      return {}
    })
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildSpy)
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildSpy)
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
      pacienteNombre: 'Ana, "La Grande"', pacienteRut: '11.222.333-4',
      monto: 30000, metodoPago: 'Transferencia', concepto: 'Abono',
      estado: 'Anulado', motivoAnulacion: 'Error del cajero, pago duplicado'
    }
  ]

  it('genera CSV con todos los pagos (vigentes + anulados)', () => {
    const result = exportarAuditoriaPagosCSV(pagos)
    expect(result.ok).toBe(true)
    expect(result.total).toBe(2)
    expect(result.nombreArchivo).toMatch(/^auditoria_pagos_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/)
    expect(clickSpy).toHaveBeenCalled()
    expect(blobCalls).toHaveLength(1)
  })

  it('escapa correctamente valores con comas y comillas', () => {
    exportarAuditoriaPagosCSV(pagos)
    const csv = blobCalls[0].parts[0]
    expect(csv).toContain('"Ana, ""La Grande"""')
    expect(csv).toContain('"Error del cajero, pago duplicado"')
  })

  it('incluye la cabecera de columnas', () => {
    exportarAuditoriaPagosCSV(pagos)
    const csv = blobCalls[0].parts[0]
    expect(csv.startsWith('id,folioComprobante,folioDTE,fecha,hora')).toBe(true)
  })

  it('retorna ok:false si pagos no es array', () => {
    const result = exportarAuditoriaPagosCSV(null)
    expect(result.ok).toBe(false)
    expect(result.total).toBe(0)
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('exporta array vacío sin fallar', () => {
    const result = exportarAuditoriaPagosCSV([])
    expect(result.ok).toBe(true)
    expect(result.total).toBe(0)
    expect(blobCalls[0].parts[0]).toContain('id,folioComprobante')
  })

  it('usa MIME type text/csv', () => {
    exportarAuditoriaPagosCSV(pagos)
    expect(blobCalls[0].opts.type).toBe('text/csv;charset=utf-8;')
  })
})
