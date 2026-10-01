import { describe, it, expect } from 'vitest'
import { calcularResumenArancel } from './prestacionesCalculations'

describe('prestacionesCalculations', () => {
  it('retorna valores por defecto cuando el array esta vacio', () => {
    const res = calcularResumenArancel([])
    expect(res.totalProcedimientos).toBe(0)
    expect(res.precioPromedio).toBe(0)
    expect(res.especialidadMasFrecuente).toBe('N/I')
  })

  it('calcula correctamente el total, promedio, maximo y especialidad mas frecuente', () => {
    const prestaciones = [
      { precioParticular: 20000, especialidad: 'Endodoncia' },
      { precioParticular: 30000, especialidad: 'Endodoncia' },
      { precioParticular: 10000, especialidad: 'Periodoncia' }
    ]
    const res = calcularResumenArancel(prestaciones)
    expect(res.totalProcedimientos).toBe(3)
    expect(res.precioPromedio).toBe(20000)
    expect(res.precioMaximo).toBe(30000)
    expect(res.especialidadMasFrecuente).toBe('Endodoncia')
  })
})
