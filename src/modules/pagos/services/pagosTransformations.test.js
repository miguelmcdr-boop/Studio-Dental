import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../services/migrationStorageService', () => ({
  migrationStorageService: {
    obtenerSupabaseId: vi.fn(() => null),
    registrarMapeo: vi.fn()
  }
}))

vi.mock('../../../services/migrations/uuidUtils', () => ({
  esUuidValido: (v) => typeof v === 'string' && v.length > 20
}))

import { transformarParaSupabase, transformarDesdeSupabase } from './pagosTransformations'

describe('pagosTransformations (Commit K1)', () => {
  describe('transformarParaSupabase', () => {
    it('omite columnas que no existen en Supabase', () => {
      const pagoJs = {
        id: '0f6bc8ef-965a-4962-ac20-0ab5edf95e46',
        folioComprobante: 'REC-2026-1730',
        monto: 10000,
        metodoPago: 'Efectivo',
        tipoDTE: 'boleta_honorarios',
        folioDTE: 'BH-100',
        pacienteNombre: 'Ana Garcia',
        pacienteRut: '12.345.678-9',
        hora: '10:30',
        observacion: 'Test',
        emitidoPor: 'Cajero',
        motivoPurga: 'Probando APP',
        fechaPurga: '13/09/2026',
        purgadoPor: 'admin@test.com',
        prestacionesImputadas: ['Corona']
      }

      const result = transformarParaSupabase(pagoJs)

      expect(result.id).toBe('0f6bc8ef-965a-4962-ac20-0ab5edf95e46')
      expect(result.folio).toBe('REC-2026-1730')
      expect(result.monto).toBe(10000)
      expect(result.metodo_pago).toBe('Efectivo')
      expect(result.tipo_dte).toBeUndefined()
      expect(result.folio_dte).toBeUndefined()
      expect(result.paciente_nombre).toBeUndefined()
      expect(result.paciente_rut).toBeUndefined()
      expect(result.hora).toBeUndefined()
      expect(result.observacion).toBeUndefined()
      expect(result.emitido_por).toBeUndefined()
      expect(result.motivo_purga).toBeUndefined()
      expect(result.fecha_purga).toBeUndefined()
      expect(result.purgado_por).toBeUndefined()
      expect(result.prestaciones_imputadas).toBeUndefined()
    })

    it('mapea folioComprobante a folio correctamente', () => {
      const pagoJs = { id: 'uuid-1', folioComprobante: 'REC-001' }
      const result = transformarParaSupabase(pagoJs)
      expect(result.folio).toBe('REC-001')
      expect(result.folio_comprobante).toBeUndefined()
    })

    it('incluye columnas validas de anulacion', () => {
      const pagoJs = {
        id: 'uuid-largo-123456789012345678',
        folioComprobante: 'REC-001',
        estado: 'Anulado',
        motivoAnulacion: 'Error cajero',
        fechaAnulacion: '13/09/2026'
      }
      const result = transformarParaSupabase(pagoJs)
      expect(result.folio).toBe('REC-001')
      expect(result.estado).toBe('Anulado')
      expect(result.motivo_anulacion).toBe('Error cajero')
      expect(result.fecha_anulacion).toBe('13/09/2026')
    })

    it('maneja pacienteId con UUID valido', () => {
      const pagoJs = {
        id: 'uuid-1',
        pacienteId: '0f6bc8ef-965a-4962-ac20-0ab5edf95e46'
      }
      const result = transformarParaSupabase(pagoJs)
      expect(result.paciente_id).toBe('0f6bc8ef-965a-4962-ac20-0ab5edf95e46')
    })

    it('retorna null si pagoJs es null', () => {
      expect(transformarParaSupabase(null)).toBeNull()
    })
  })

  describe('transformarDesdeSupabase', () => {
    it('mapea snake_case a camelCase', () => {
      const db = {
        id: 'uuid-1',
        folio: 'REC-001',
        paciente_id: 'pac-uuid',
        metodo_pago: 'Efectivo',
        motivo_anulacion: 'err',
        fecha_anulacion: '13/09',
        clinica_id: 'clin-uuid'
      }
      const result = transformarDesdeSupabase(db)
      expect(result.id).toBe('uuid-1')
      expect(result.folioComprobante).toBe('REC-001')
      expect(result.pacienteId).toBe('pac-uuid')
      expect(result.metodoPago).toBe('Efectivo')
      expect(result.motivoAnulacion).toBe('err')
      expect(result.fechaAnulacion).toBe('13/09')
      expect(result.clinicaId).toBe('clin-uuid')
    })

    it('pasa columnas desconocidas tal cual', () => {
      const db = { columna_nueva: 'valor' }
      const result = transformarDesdeSupabase(db)
      expect(result.columna_nueva).toBe('valor')
    })

    it('retorna null si pagoDb es null', () => {
      expect(transformarDesdeSupabase(null)).toBeNull()
    })
  })
})
