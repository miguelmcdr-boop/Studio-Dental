import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./pagosStorageService', () => ({
  pagosStorageService: {
    obtenerPagos: vi.fn(() => []),
    guardarPagos: vi.fn(() => Promise.resolve(true))
  }
}))

vi.mock('../../../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
  })
}))

import {
  obtenerPagosPurgados,
  restaurarPago,
  limpiarVencidos,
  diasRestantes,
  vaciarPapelera
} from './papeleraPagosService'
import { pagosStorageService } from './pagosStorageService'

describe('papeleraPagosService (Commit K)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerPagosPurgados', () => {
    it('filtra solo pagos con estado Purgado', () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, estado: 'Emitido' },
        { id: 2, estado: 'Purgado', fechaPurga: '01/01/2026' },
        { id: 3, estado: 'Anulado' }
      ])

      const result = obtenerPagosPurgados()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(2)
    })
  })

  describe('diasRestantes', () => {
    it('calcula días restantes hasta auto-eliminación', () => {
      // Fecha de hoy en formato chileno explícito (no depende de locale del sistema)
      const hoy = new Date()
      const dd = String(hoy.getDate()).padStart(2, '0')
      const mm = String(hoy.getMonth() + 1).padStart(2, '0')
      const yyyy = hoy.getFullYear()
      const fechaReciente = `${dd}/${mm}/${yyyy}`
      const dias = diasRestantes(fechaReciente)
      expect(dias).toBeGreaterThan(728)
      expect(dias).toBeLessThanOrEqual(730)
    })

    it('acepta formato DD-MM-YYYY (con guiones)', () => {
      const hoy = new Date()
      const dd = String(hoy.getDate()).padStart(2, '0')
      const mm = String(hoy.getMonth() + 1).padStart(2, '0')
      const fechaHoyGuiones = `${dd}-${mm}-${hoy.getFullYear()}`
      const dias = diasRestantes(fechaHoyGuiones)
      expect(dias).toBeGreaterThanOrEqual(728)
      expect(dias).toBeLessThanOrEqual(730)
    })

    it('clampea a 730 si la fecha de purga es futura', () => {
      const dias = diasRestantes('01-01-2030')
      expect(dias).toBe(730)
    })

    it('retorna 0 si han pasado más de 730 días', () => {
      const fechaAntigua = '01/01/2020'
      const dias = diasRestantes(fechaAntigua)
      expect(dias).toBe(0)
    })

    it('retorna null si fecha es inválida', () => {
      expect(diasRestantes(null)).toBeNull()
      expect(diasRestantes('invalida')).toBeNull()
    })
  })

  describe('restaurarPago', () => {
    it('cambia estado de Purgado a Anulado', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, estado: 'Purgado', folioComprobante: 'REC-001', monto: 50000 }
      ])

      const result = await restaurarPago(1)

      expect(result).toBe(true)
      expect(pagosStorageService.guardarPagos).toHaveBeenCalled()
      const actualizados = pagosStorageService.guardarPagos.mock.calls[0][0]
      expect(actualizados[0].estado).toBe('Anulado')
      expect(actualizados[0].motivoPurga).toBeNull()
    })

    it('retorna false si pago no existe o no está purgado', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, estado: 'Emitido' }
      ])

      const result = await restaurarPago(1)
      expect(result).toBe(false)
      expect(pagosStorageService.guardarPagos).not.toHaveBeenCalled()
    })
  })

  describe('limpiarVencidos', () => {
    it('elimina pagos con >730 días desde purga', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, estado: 'Purgado', fechaPurga: '01/01/2020', folioComprobante: 'REC-001' },
        { id: 2, estado: 'Purgado', fechaPurga: new Date().toLocaleDateString('es-CL'), folioComprobante: 'REC-002' }
      ])

      const eliminados = await limpiarVencidos()

      expect(eliminados).toBe(1)
      expect(pagosStorageService.guardarPagos).toHaveBeenCalled()
      const restantes = pagosStorageService.guardarPagos.mock.calls[0][0]
      expect(restantes).toHaveLength(1)
      expect(restantes[0].id).toBe(2)
    })

    it('retorna 0 si no hay vencidos', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, estado: 'Purgado', fechaPurga: new Date().toLocaleDateString('es-CL') }
      ])

      const eliminados = await limpiarVencidos()
      expect(eliminados).toBe(0)
      expect(pagosStorageService.guardarPagos).not.toHaveBeenCalled()
    })
  })

  describe('vaciarPapelera (Commit K3)', () => {
    it('elimina todos los purgados y preserva el resto', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, estado: 'Purgado', folioComprobante: 'REC-001', monto: 100 },
        { id: 2, estado: 'Purgado', folioComprobante: 'REC-002', monto: 200 },
        { id: 3, estado: 'Emitido', folioComprobante: 'REC-003', monto: 300 },
        { id: 4, estado: 'Anulado', folioComprobante: 'REC-004', monto: 400 }
      ])

      const eliminados = await vaciarPapelera()

      expect(eliminados).toBe(2)
      expect(pagosStorageService.guardarPagos).toHaveBeenCalled()
      const restantes = pagosStorageService.guardarPagos.mock.calls[0][0]
      expect(restantes).toHaveLength(2)
      expect(restantes.map(p => p.id)).toEqual([3, 4])
    })

    it('retorna 0 si la papelera está vacía', async () => {
      pagosStorageService.obtenerPagos.mockReturnValue([
        { id: 1, estado: 'Emitido' }
      ])

      const eliminados = await vaciarPapelera()
      expect(eliminados).toBe(0)
      expect(pagosStorageService.guardarPagos).not.toHaveBeenCalled()
    })
  })
})
