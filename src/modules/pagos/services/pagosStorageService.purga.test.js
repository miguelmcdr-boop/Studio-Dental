import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/localStorageRepository', () => ({
  createLocalStorageRepository: () => ({
    obtener: vi.fn(() => []),
    guardar: vi.fn()
  }),
  leerJSON: vi.fn(() => []),
  escribirJSON: vi.fn()
}))

vi.mock('../../../services/supabaseClient', () => ({
  supabase: null,
  USE_SUPABASE: false
}))

vi.mock('../../../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
  })
}))

vi.mock('../../../services/migrationStorageService', () => ({
  migrationStorageService: { get: vi.fn(() => null) }
}))

vi.mock('./pagosTransformations', () => ({
  transformarDesdeSupabase: (x) => x,
  transformarParaSupabase: (x) => x
}))

vi.mock('../../../services/migrations/uuidUtils', () => ({
  esUuidValido: () => false
}))

import { pagosStorageService } from './pagosStorageService'
import { leerJSON, escribirJSON } from '../../../services/localStorageRepository'

describe('pagosStorageService — Commit C', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sincronizarAbonoConFichaPaciente (dedup)', () => {
    it('no duplica abonos con el mismo id al sincronizar dos veces', () => {
      leerJSON.mockReturnValue([
        { id: 100, monto: 50000, fecha: '01/01/2026' }
      ])

      pagosStorageService.sincronizarAbonoConFichaPaciente(42, {
        id: 100,
        fecha: '02/01/2026',
        monto: 50000,
        metodoPago: 'Efectivo',
        folioComprobante: 'REC-001',
        pacienteNombre: 'Test'
      })

      expect(escribirJSON).toHaveBeenCalled()
      const [key, data] = escribirJSON.mock.calls[0]
      expect(key).toBe('abonos_42')
      // Debe haber UN solo abono con id 100 (el nuevo reemplazó al viejo)
      expect(data).toHaveLength(1)
      expect(data[0].fecha).toBe('02/01/2026')
    })

    it('agrega nuevo abono si el id no existía', () => {
      leerJSON.mockReturnValue([
        { id: 100, monto: 50000 }
      ])

      pagosStorageService.sincronizarAbonoConFichaPaciente(42, {
        id: 200,
        fecha: '03/01/2026',
        monto: 30000,
        metodoPago: 'Efectivo',
        folioComprobante: 'REC-002',
        pacienteNombre: 'Test'
      })

      const data = escribirJSON.mock.calls[0][1]
      expect(data).toHaveLength(2)
    })
  })

  describe('removerAbonoDeFichaPaciente', () => {
    it('retorna true y filtra el abono si existe', () => {
      leerJSON.mockReturnValue([
        { id: 100, monto: 50000 },
        { id: 200, monto: 30000 }
      ])

      const result = pagosStorageService.removerAbonoDeFichaPaciente(42, 100)

      expect(result).toBe(true)
      const data = escribirJSON.mock.calls[0][1]
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(200)
    })

    it('retorna false si el abono no existía', () => {
      leerJSON.mockReturnValue([{ id: 100, monto: 50000 }])

      const result = pagosStorageService.removerAbonoDeFichaPaciente(42, 999)

      expect(result).toBe(false)
      expect(escribirJSON).not.toHaveBeenCalled()
    })

    it('retorna false si pacienteId es nulo', () => {
      const result = pagosStorageService.removerAbonoDeFichaPaciente(null, 100)
      expect(result).toBe(false)
    })
  })
})
