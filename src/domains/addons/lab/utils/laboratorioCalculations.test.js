import { describe, it, expect } from 'vitest'
import {
  generarCodigoOrdenLab,
  buscarTarifaSugerida,
  calcularResumenLaboratorio
} from './laboratorioCalculations'

describe('laboratorioCalculations', () => {
  it('genera un codigo de orden con prefijo LAB y anio', () => {
    const cod = generarCodigoOrdenLab()
    expect(cod).toMatch(/^LAB-\d{4}-\d{3}$/)
  })

  it('busca tarifa sugerida en laboratorios', () => {
    const labs = [
      { id: 1, tarifas: [{ trabajo: 'Corona Zirconio', precio: 45000 }] }
    ]
    expect(buscarTarifaSugerida(labs, 1, 'Corona Zirconio')).toBe(45000)
    expect(buscarTarifaSugerida(labs, 1, 'Incrustacion')).toBe(0)
    expect(buscarTarifaSugerida(labs, 2, 'Corona Zirconio')).toBe(0)
  })

  it('calcula resumen de laboratorio con costos y etapas', () => {
    const ordenes = [
      { costoLaboratorio: 50000, etapa: 'Enviado', estadoPagoLab: 'Pendiente' },
      { costoLaboratorio: 30000, etapa: 'RecibidoListo', estadoPagoLab: 'Pagado' }
    ]
    const res = calcularResumenLaboratorio(ordenes)
    expect(res.totalOrdenes).toBe(2)
    expect(res.costoTotalLab).toBe(80000)
    expect(res.montoPendientePagoLab).toBe(50000)
    expect(res.enProcesoCount).toBe(1)
    expect(res.listosInstalarCount).toBe(1)
  })
})
