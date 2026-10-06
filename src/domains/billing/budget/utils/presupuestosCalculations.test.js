import { describe, it, expect } from 'vitest'
import {
  generarFolioPresupuesto,
  calcularSimulacionCuotas,
  calcularResumenPresupuestos
} from './presupuestosCalculations'

describe('presupuestosCalculations', () => {
  it('genera un folio de presupuesto con prefijo PRES', () => {
    const folio = generarFolioPresupuesto()
    expect(folio).toMatch(/^PRES-\d{4}-\d{4}$/)
  })

  it('calcula simulacion de cuotas correctamente', () => {
    const res = calcularSimulacionCuotas(300000, 60000, 3)
    expect(res.saldoFinanciar).toBe(240000)
    expect(res.valorCuota).toBe(80000)
    expect(res.numCuotas).toBe(3)
  })

  it('calcula resumen de presupuestos con tasa de conversion', () => {
    const presupuestos = [
      { montoTotal: 100000, montoAbonado: 50000, estado: 'Aprobado' },
      { montoTotal: 50000, montoAbonado: 0, estado: 'Borrador' }
    ]
    const res = calcularResumenPresupuestos(presupuestos)
    expect(res.totalEmitidos).toBe(2)
    expect(res.totalCotizado).toBe(150000)
    expect(res.totalAprobado).toBe(100000)
    expect(res.totalAbonado).toBe(50000)
    expect(res.totalPendienteCobro).toBe(100000)
    expect(res.tasaConversion).toBe(50)
  })
})
