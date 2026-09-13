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

describe('pagosTransformations (Commit J)', () => {
  describe('transformarParaSupabase', () => {
    it('omite columnas que no existen en Supabase', () => {
      const pagoJs = {
        id: '0f6bc8ef-965a-4962-ac20-0ab5edf95e46',
        folioComprobante: 'REC-2026-1730',
        monto: 10000,
        metodoPago: 'Efectivo',
        emitidoPor: 'Cajero',
        motivoPurga: 'Probando APP',
        fechaPurga: '13/09/2026',
        purgadoPor: 'admin@test.com',
        prestacionesImputadas: ['Corona']
      }

      const result = transformarParaSupabase(pagoJs)

      // Columnas válidas deben estar (en snake_case)
      expect(result.id).toBe('0f6bc8ef-965a-4962-ac20-0ab5edf95e46')
      expect(result.folio_comprobante).toBe('REC-2026-1730')
      expect(result.monto).toBe(10000)
      expect(result.metodo_pago).toBe('Efectivo')
      // Columnas desconocidas NO deben estar (evita 400 de Supabase)
      expect(result.emitido_por).toBeUndefined()
      expect(result.emitidoPor).toBeUndefined()
      expect(result.motivo_purga).toBeUndefined()
      expect(result.motivoPurga).toBeUndefined()
      expect(result.fecha_purga).toBeUndefined()
      expect(result.fechaPurga).toBeUndefined()
      expect(result.purgado_por).toBeUndefined()
      expect(result.purgadoPor).toBeUndefined()
      expect(result.prestaciones_imputadas).toBeUndefined()
      expect(result.prestacionesImputadas).toBeUndefined()
    })

    it('incluye columnas válidas con conversión correcta', () => {
      const pagoJs = {
        id: 'uuid-largo-123456789012345678',
        folioComprobante: 'REC-001',
        tipoDTE: 'boleta_honorarios',
        folioDTE: 'BH-100',
        pacienteNombre: 'Ana García',
        pacienteRut: '12.345.678-9',
        estado: 'Anulado',
        motivoAnulacion: 'Error cajero',
        fechaAnulacion: '13/09/2026'
      }

      const result = transformarParaSupabase(pagoJs)
      expect(result.folio_comprobante).toBe('REC-001')
      expect(result.tipo_dte).toBe('boleta_honorarios')
      expect(result.folio_dte).toBe('BH-100')
      expect(result.paciente_nombre).toBe('Ana García')
      expect(result.paciente_rut).toBe('12.345.678-9')
      expect(result.estado).toBe('Anulado')
      expect(result.motivo_anulacion).toBe('Error cajero')
      expect(result.fecha_anulacion).toBe('13/09/2026')
    })

    it('maneja pacienteId con UUID válido', () => {
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
        folio_comprobante: 'REC-001',
        tipo_dte: 'boleta_honorarios',
        paciente_id: 'pac-uuid',
        metodo_pago: 'Efectivo',
        motivo_anulacion: 'err',
        fecha_anulacion: '13/09'
      }
      const result = transformarDesdeSupabase(db)
      expect(result.id).toBe('uuid-1')
      expect(result.folioComprobante).toBe('REC-001')
      expect(result.tipoDTE).toBe('boleta_honorarios')
      expect(result.pacienteId).toBe('pac-uuid')
      expect(result.metodoPago).toBe('Efectivo')
      expect(result.motivoAnulacion).toBe('err')
      expect(result.fechaAnulacion).toBe('13/09')
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
