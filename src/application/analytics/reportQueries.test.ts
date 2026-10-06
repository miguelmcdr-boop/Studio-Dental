import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  obtenerDatosConsolidadosReportes,
  obtenerProductividadPorProfesional,
  obtenerRankingPrestaciones,
  obtenerIngresosPorPeriodo,
} from './reportQueries'
import { pacientesStorageService } from '../../domains/clinical/patient'
import { agendaStorageService } from '../../domains/operations/agenda'
import { pagosStorageService } from '../../domains/billing/payment'
import { presupuestosStorageService } from '../../domains/billing/budget'

describe('reportQueries (Application Service)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('obtenerDatosConsolidadosReportes', () => {
    it('debe recopilar datos de los 4 dominios correctamente', () => {
      vi.spyOn(pacientesStorageService, 'obtenerPacientes').mockReturnValue([
        { id: 'pac-1', nombre: 'Ana' } as any,
      ])
      vi.spyOn(agendaStorageService, 'obtenerCitas').mockReturnValue([
        { id: 'c-1', fecha: '2026-10-01', horaInicio: '10:00', estado: 'Completado' },
      ])
      vi.spyOn(pagosStorageService, 'obtenerPagos').mockReturnValue([
        { id: 'pg-1', monto: 45000, estado: 'Pagado' },
      ])
      vi.spyOn(presupuestosStorageService, 'obtenerPresupuestos').mockReturnValue([
        { id: 'pr-1', total: 120000 } as any,
      ])

      const data = obtenerDatosConsolidadosReportes()
      expect(data.pacientes).toHaveLength(1)
      expect(data.citas).toHaveLength(1)
      expect(data.pagos).toHaveLength(1)
      expect(data.presupuestos).toHaveLength(1)
    })

    it('debe manejar errores retornando estructuras vacías', () => {
      vi.spyOn(pacientesStorageService, 'obtenerPacientes').mockImplementation(() => {
        throw new Error('Fail')
      })
      const data = obtenerDatosConsolidadosReportes()
      expect(data.pacientes).toEqual([])
      expect(data.citas).toEqual([])
    })
  })

  describe('obtenerProductividadPorProfesional', () => {
    it('debe agrupar citas y contar completadas por profesional', () => {
      const citasMock = [
        { id: '1', fecha: '2026-10-02', doctor: 'Dr. Pérez', estado: 'Completado' },
        { id: '2', fecha: '2026-10-02', doctor: 'Dr. Pérez', estado: 'Agendado' },
        { id: '3', fecha: '2026-10-03', doctor: 'Dra. Soto', estado: 'Completado' },
        { id: '4', fecha: '2026-09-01', doctor: 'Dr. Pérez', estado: 'Completado' }, // Fuera de rango
      ]

      const res = obtenerProductividadPorProfesional(
        citasMock as any,
        '2026-10-01',
        '2026-10-31'
      )

      expect(res).toHaveLength(2)
      const perez = res.find((r) => r.profesional === 'Dr. Pérez')
      expect(perez?.totalCitas).toBe(2)
      expect(perez?.citasCompletadas).toBe(1)

      const soto = res.find((r) => r.profesional === 'Dra. Soto')
      expect(soto?.totalCitas).toBe(1)
      expect(soto?.citasCompletadas).toBe(1)
    })
  })

  describe('obtenerRankingPrestaciones', () => {
    it('debe sumar cantidades y montos por prestación y ordenar descendente', () => {
      vi.spyOn(presupuestosStorageService, 'obtenerItemsPorPaciente').mockImplementation(
        (id) => {
          if (id === '1') {
            return [
              { prestacion: 'Limpieza', valor: 30000, especialidad: 'Prevención' },
              { prestacion: 'Corona', valor: 150000, especialidad: 'Rehabilitación' },
            ] as any
          }
          if (id === '2') {
            return [
              { prestacion: 'Limpieza', valor: 30000, especialidad: 'Prevención' },
            ] as any
          }
          return []
        }
      )

      const ranking = obtenerRankingPrestaciones([{ id: '1' }, { id: '2' }], 5)
      expect(ranking).toHaveLength(2)
      // Corona tiene mayor monto total (150000 vs 60000)
      expect(ranking[0].nombre).toBe('Corona')
      expect(ranking[0].montoTotal).toBe(150000)
      expect(ranking[0].cantidad).toBe(1)

      expect(ranking[1].nombre).toBe('Limpieza')
      expect(ranking[1].montoTotal).toBe(60000)
      expect(ranking[1].cantidad).toBe(2)
    })
  })

  describe('obtenerIngresosPorPeriodo', () => {
    it('debe filtrar por rango de fechas y desglosar por método de pago', () => {
      const mockPagos = [
        { id: '1', fecha: '2026-10-05', monto: 50000, metodoPago: 'Tarjeta Débito', estado: 'Pagado' },
        { id: '2', fecha: '2026-10-06', monto: 20000, metodoPago: 'Efectivo', estado: 'Pagado' },
        { id: '3', fecha: '2026-10-07', monto: 100000, metodoPago: 'Efectivo', estado: 'Anulado' }, // Ignorado
        { id: '4', fecha: '2026-09-20', monto: 40000, metodoPago: 'Efectivo', estado: 'Pagado' }, // Fuera de rango
      ]

      const res = obtenerIngresosPorPeriodo('2026-10-01', '2026-10-10', mockPagos as any)
      expect(res.totalRecaudado).toBe(70000)
      expect(res.cantidadTransacciones).toBe(2)
      expect(res.desglosePorMetodo).toEqual({
        'Tarjeta Débito': 50000,
        Efectivo: 20000,
      })
    })
  })
})
