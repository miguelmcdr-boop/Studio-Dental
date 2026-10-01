import { describe, it, expect } from 'vitest'
import {
  presupuestoSchema,
  listaPresupuestosSchema,
  validarListaPresupuestos
} from './presupuestoSchema'

describe('presupuestoSchema (F2-04e)', () => {
  describe('Presupuesto válido con campos mínimos', () => {
    it('acepta presupuesto con solo los 4 campos obligatorios', () => {
      const presupuesto = {
        id: 1,
        folio: 'P-001',
        pacienteNombre: 'Juan Pérez',
        estado: 'Pendiente'
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(true)
    })

    it('acepta presupuesto con id string (consolidado desde paciente)', () => {
      const presupuesto = {
        id: 'paciente_42',
        folio: 'PRES-PAC-42',
        pacienteNombre: 'Ana García',
        estado: 'Aprobado'
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(true)
    })
  })

  describe('Presupuesto válido con todos los campos', () => {
    it('acepta presupuesto consolidado completo desde paciente', () => {
      const presupuesto = {
        id: 'paciente_1',
        folio: 'PRES-PAC-1',
        pacienteId: 1,
        pacienteNombre: 'Ana García',
        pacienteRut: '12.345.678-9',
        fechaEmision: '2026-08-12',
        convenio: 'Particular',
        montoTotal: 150000,
        montoAbonado: 50000,
        estado: 'EnTratamiento',
        items: [{ id: 1, nombre: 'Limpieza', valor: 35000 }],
        observacion: 'Presupuesto vinculado desde la Ficha Médica del paciente.'
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(true)
      expect(result.data.montoTotal).toBe(150000)
    })

    it('acepta presupuesto directo con campo "total" en lugar de "montoTotal"', () => {
      const presupuesto = {
        id: 1,
        folio: 'P-001',
        pacienteNombre: 'Juan Pérez',
        pacienteRut: '12.345.678-9',
        estado: 'Pendiente',
        total: 50000
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(true)
      expect(result.data.total).toBe(50000)
    })
  })

  describe('Validación de estados', () => {
    const presupuestoBase = { id: 1, folio: 'P-001', pacienteNombre: 'Test' }

    it.each([
      'Emitido',
      'Pendiente',
      'Aprobado',
      'Rechazado',
      'EnTratamiento'
    ])('acepta estado "%s"', (estado) => {
      const result = presupuestoSchema.safeParse({ ...presupuestoBase, estado })
      expect(result.success).toBe(true)
    })
  })

  describe('Presupuestos inválidos (campos obligatorios ausentes)', () => {
    it('rechaza presupuesto sin id', () => {
      const presupuesto = {
        folio: 'P-001',
        pacienteNombre: 'Test',
        estado: 'Pendiente'
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(false)
    })

    it('rechaza presupuesto sin folio', () => {
      const presupuesto = {
        id: 1,
        pacienteNombre: 'Test',
        estado: 'Pendiente'
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(false)
    })

    it('rechaza presupuesto con folio vacío', () => {
      const presupuesto = {
        id: 1,
        folio: '',
        pacienteNombre: 'Test',
        estado: 'Pendiente'
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(false)
    })

    it('rechaza presupuesto sin pacienteNombre', () => {
      const presupuesto = {
        id: 1,
        folio: 'P-001',
        estado: 'Pendiente'
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(false)
    })

    it('rechaza presupuesto sin estado', () => {
      const presupuesto = {
        id: 1,
        folio: 'P-001',
        pacienteNombre: 'Test'
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(false)
    })

    it('rechaza presupuesto con estado vacío', () => {
      const presupuesto = {
        id: 1,
        folio: 'P-001',
        pacienteNombre: 'Test',
        estado: ''
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(false)
    })
  })

  describe('Passthrough (permite campos adicionales)', () => {
    it('acepta presupuesto con campos no catalogados sin fallar', () => {
      const presupuesto = {
        id: 1,
        folio: 'P-001',
        pacienteNombre: 'Test',
        estado: 'Pendiente',
        descuento: 10,
        profesionalResponsable: 'Dr. Díaz',
        campoFuturo: { anidado: 'valor' }
      }
      const result = presupuestoSchema.safeParse(presupuesto)
      expect(result.success).toBe(true)
      expect(result.data.descuento).toBe(10)
      expect(result.data.profesionalResponsable).toBe('Dr. Díaz')
    })
  })
})

describe('listaPresupuestosSchema (F2-04e)', () => {
  it('acepta array vacío', () => {
    const result = listaPresupuestosSchema.safeParse([])
    expect(result.success).toBe(true)
  })

  it('acepta array con múltiples presupuestos válidos', () => {
    const presupuestos = [
      { id: 1, folio: 'P-001', pacienteNombre: 'Juan', estado: 'Pendiente' },
      { id: 2, folio: 'P-002', pacienteNombre: 'Ana', estado: 'Aprobado' },
      { id: 'paciente_3', folio: 'PRES-PAC-3', pacienteNombre: 'Carlos', estado: 'EnTratamiento' }
    ]
    const result = listaPresupuestosSchema.safeParse(presupuestos)
    expect(result.success).toBe(true)
  })

  it('rechaza array con al menos un presupuesto inválido', () => {
    const presupuestos = [
      { id: 1, folio: 'P-001', pacienteNombre: 'Test', estado: 'Pendiente' },
      { id: 2, folio: 'P-002' } // faltan pacienteNombre y estado
    ]
    const result = listaPresupuestosSchema.safeParse(presupuestos)
    expect(result.success).toBe(false)
  })
})

describe('validarListaPresupuestos (F2-04e)', () => {
  it('retorna valido: true y datos correctos para lista válida', () => {
    const presupuestos = [
      { id: 1, folio: 'P-001', pacienteNombre: 'Test', estado: 'Pendiente' }
    ]
    const result = validarListaPresupuestos(presupuestos)
    expect(result.valido).toBe(true)
    expect(result.datos).toHaveLength(1)
    expect(result.error).toBeNull()
  })

  it('retorna valido: false y error para lista inválida', () => {
    const presupuestos = [
      { id: 1, folio: 'P-001' } // faltan pacienteNombre y estado
    ]
    const result = validarListaPresupuestos(presupuestos)
    expect(result.valido).toBe(false)
    expect(result.datos).toBeNull()
    expect(result.error).not.toBeNull()
  })

  it('maneja entrada null/undefined retornando valido: false', () => {
    expect(validarListaPresupuestos(null).valido).toBe(false)
    expect(validarListaPresupuestos(undefined).valido).toBe(false)
    expect(validarListaPresupuestos('no es array').valido).toBe(false)
  })
})