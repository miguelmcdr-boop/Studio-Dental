import { describe, it, expect } from 'vitest'
import {
  movimientoFinancieroSchema,
  listaMovimientosSchema,
  validarListaMovimientos
} from './movimientoFinancieroSchema'

describe('movimientoFinancieroSchema (F2-04c)', () => {
  describe('Movimiento válido con campos mínimos', () => {
    it('acepta movimiento de Ingreso con todos los campos obligatorios', () => {
      const movimiento = {
        id: 1,
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        categoria: 'Efectivo',
        monto: 10000,
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(true)
    })

    it('acepta movimiento de Egreso con monto negativo', () => {
      const movimiento = {
        id: 2,
        fecha: '12/08/2026',
        tipo: 'Egreso',
        categoria: 'Insumos',
        monto: -5000,
        metodoPago: 'Transferencia'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(true)
    })

    it('acepta movimiento con id string', () => {
      const movimiento = {
        id: 'mov_manual_123',
        fecha: '2026-08-12',
        tipo: 'Ingreso',
        categoria: 'Otros Ingresos',
        monto: 15000,
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(true)
    })
  })

  describe('Movimiento válido con todos los campos', () => {
    it('acepta movimiento completo con campos opcionales', () => {
      const movimiento = {
        id: 'pago_global_42',
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        categoria: 'Pago Paciente (Boleta/Factura)',
        monto: 50000,
        metodoPago: 'Tarjeta',
        pacienteNombre: 'Juan Pérez',
        origen: 'Pagos'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(true)
      expect(result.data.pacienteNombre).toBe('Juan Pérez')
      expect(result.data.origen).toBe('Pagos')
    })

    it('acepta movimiento de abono con origen Presupuestos', () => {
      const movimiento = {
        id: 'abono_1_5',
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        categoria: 'Abono Plan de Tratamiento',
        monto: 20000,
        metodoPago: 'Efectivo',
        pacienteNombre: 'Ana García',
        origen: 'Presupuestos'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(true)
    })
  })

  describe('Validación de tipos', () => {
    it.each(['Ingreso', 'Egreso'])('acepta tipo "%s"', (tipo) => {
      const movimiento = {
        id: 1,
        fecha: '12/08/2026',
        tipo,
        categoria: 'Test',
        monto: 1000,
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(true)
    })
  })

  describe('Movimientos inválidos (campos obligatorios ausentes)', () => {
    it('rechaza movimiento sin id', () => {
      const movimiento = {
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        categoria: 'Test',
        monto: 1000,
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(false)
    })

    it('rechaza movimiento sin fecha', () => {
      const movimiento = {
        id: 1,
        tipo: 'Ingreso',
        categoria: 'Test',
        monto: 1000,
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(false)
    })

    it('rechaza movimiento sin tipo', () => {
      const movimiento = {
        id: 1,
        fecha: '12/08/2026',
        categoria: 'Test',
        monto: 1000,
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(false)
    })

    it('rechaza movimiento sin categoria', () => {
      const movimiento = {
        id: 1,
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        monto: 1000,
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(false)
    })

    it('rechaza movimiento sin monto', () => {
      const movimiento = {
        id: 1,
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        categoria: 'Test',
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(false)
    })

    it('rechaza movimiento sin metodoPago', () => {
      const movimiento = {
        id: 1,
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        categoria: 'Test',
        monto: 1000
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(false)
    })

    it('rechaza movimiento con fecha vacía', () => {
      const movimiento = {
        id: 1,
        fecha: '',
        tipo: 'Ingreso',
        categoria: 'Test',
        monto: 1000,
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(false)
    })

    it('rechaza movimiento con monto como string (no number)', () => {
      const movimiento = {
        id: 1,
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        categoria: 'Test',
        monto: '1000', // string en vez de number
        metodoPago: 'Efectivo'
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(false)
    })
  })

  describe('Passthrough (permite campos adicionales)', () => {
    it('acepta movimiento con campos no catalogados sin fallar', () => {
      const movimiento = {
        id: 1,
        fecha: '12/08/2026',
        tipo: 'Ingreso',
        categoria: 'Test',
        monto: 1000,
        metodoPago: 'Efectivo',
        notas: 'Pago anticipado',
        referencia: 'REF-123',
        campoFuturo: { anidado: 'valor' }
      }
      const result = movimientoFinancieroSchema.safeParse(movimiento)
      expect(result.success).toBe(true)
      expect(result.data.notas).toBe('Pago anticipado')
      expect(result.data.referencia).toBe('REF-123')
    })
  })
})

describe('listaMovimientosSchema (F2-04c)', () => {
  it('acepta array vacío', () => {
    const result = listaMovimientosSchema.safeParse([])
    expect(result.success).toBe(true)
  })

  it('acepta array con múltiples movimientos válidos', () => {
    const movimientos = [
      { id: 1, fecha: '12/08/2026', tipo: 'Ingreso', categoria: 'Efectivo', monto: 10000, metodoPago: 'Efectivo' },
      { id: 2, fecha: '12/08/2026', tipo: 'Egreso', categoria: 'Insumos', monto: -5000, metodoPago: 'Transferencia' },
      { id: 3, fecha: '13/08/2026', tipo: 'Ingreso', categoria: 'Pago Paciente', monto: 50000, metodoPago: 'Tarjeta' }
    ]
    const result = listaMovimientosSchema.safeParse(movimientos)
    expect(result.success).toBe(true)
  })

  it('rechaza array con al menos un movimiento inválido', () => {
    const movimientos = [
      { id: 1, fecha: '12/08/2026', tipo: 'Ingreso', categoria: 'Test', monto: 1000, metodoPago: 'Efectivo' },
      { id: 2, fecha: '12/08/2026', tipo: 'Egreso' } // inválido: faltan categoria, monto, metodoPago
    ]
    const result = listaMovimientosSchema.safeParse(movimientos)
    expect(result.success).toBe(false)
  })
})

describe('validarListaMovimientos (F2-04c)', () => {
  it('retorna valido: true y datos correctos para lista válida', () => {
    const movimientos = [
      { id: 1, fecha: '12/08/2026', tipo: 'Ingreso', categoria: 'Test', monto: 1000, metodoPago: 'Efectivo' }
    ]
    const result = validarListaMovimientos(movimientos)
    expect(result.valido).toBe(true)
    expect(result.datos).toHaveLength(1)
    expect(result.error).toBeNull()
  })

  it('retorna valido: false y error para lista inválida', () => {
    const movimientos = [
      { id: 1, fecha: '12/08/2026', tipo: 'Ingreso' } // faltan categoria, monto, metodoPago
    ]
    const result = validarListaMovimientos(movimientos)
    expect(result.valido).toBe(false)
    expect(result.datos).toBeNull()
    expect(result.error).not.toBeNull()
  })

  it('maneja entrada null/undefined retornando valido: false', () => {
    expect(validarListaMovimientos(null).valido).toBe(false)
    expect(validarListaMovimientos(undefined).valido).toBe(false)
    expect(validarListaMovimientos('no es array').valido).toBe(false)
  })
})