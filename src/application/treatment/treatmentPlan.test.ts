import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTreatmentPlan,
  updateTreatmentPlan,
  deleteTreatmentPlan,
} from './treatmentPlan'
import { pacientesStorageService } from '../../domains/clinical/patient'
import { prestacionesStorageService } from '../../domains/organization/prestations'
import { presupuestosStorageService } from '../../domains/billing/budget'

describe('treatmentPlan (Application Service)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(pacientesStorageService, 'guardarItem').mockImplementation(() => {})
  })

  describe('createTreatmentPlan', () => {
    it('crea un plan de tratamiento calculando subtotales y descuento', async () => {
      vi.spyOn(pacientesStorageService, 'obtenerPacientes').mockReturnValue([
        { id: 'pac-1', nombre: 'Ana Gómez' } as any,
      ])
      vi.spyOn(prestacionesStorageService, 'obtenerPrestaciones').mockReturnValue([
        { id: 'prest-1', nombre: 'Obturación Resina', precio: 30000 } as any,
        { id: 'prest-2', nombre: 'Limpieza Profilaxis', precio: 20000 } as any,
      ])
      const spyGuardarPresupuestos = vi
        .spyOn(presupuestosStorageService, 'guardarPresupuestos')
        .mockResolvedValue(true as any)
      vi.spyOn(presupuestosStorageService, 'obtenerPresupuestos').mockReturnValue([])

      const res = await createTreatmentPlan({
        pacienteId: 'pac-1',
        prestaciones: [
          { prestacionId: 'prest-1', cantidad: 2, piezaDental: '1.6' },
          { prestacionId: 'prest-2', cantidad: 1 },
        ],
        convenioId: 'Fonasa',
        descuento: 20, // 20%
      })

      // Subtotales: 30000*2 = 60000 + 20000*1 = 80000
      expect(res.totalOriginal).toBe(80000)
      // 80000 con 20% descuento = 64000
      expect(res.totalConDescuento).toBe(64000)
      expect(res.descuentoPorcentaje).toBe(20)
      expect(res.items).toHaveLength(2)
      expect(res.items[0].subtotal).toBe(60000)
      expect(res.items[0].piezaDental).toBe('1.6')

      expect(spyGuardarPresupuestos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            pacienteId: 'pac-1',
            total: 64000,
            convenio: 'Fonasa',
          }),
        ])
      )
    })
  })

  describe('updateTreatmentPlan', () => {
    it('actualiza un plan de tratamiento existente', async () => {
      vi.spyOn(presupuestosStorageService, 'obtenerPresupuestos').mockReturnValue([
        {
          id: 'pres-1',
          pacienteId: 'pac-1',
          items: [{ id: '1', prestacion: 'Limpieza', valor: 20000, cantidad: 1 }],
          total: 20000,
          totalOriginal: 20000,
          convenio: 'Particular',
        } as any,
      ])
      const spyGuardar = vi
        .spyOn(presupuestosStorageService, 'guardarPresupuestos')
        .mockResolvedValue(true as any)

      const res = await updateTreatmentPlan('pres-1', {
        descuento: 10,
      })

      expect(res.totalConDescuento).toBe(18000)
      expect(res.descuentoPorcentaje).toBe(10)
      expect(spyGuardar).toHaveBeenCalled()
    })

    it('arroja error si el presupuesto no existe', async () => {
      vi.spyOn(presupuestosStorageService, 'obtenerPresupuestos').mockReturnValue([])
      await expect(
        updateTreatmentPlan('pres-inexistente', { descuento: 10 })
      ).rejects.toThrow('no encontrado')
    })
  })

  describe('deleteTreatmentPlan', () => {
    it('elimina el presupuesto del storage', async () => {
      vi.spyOn(presupuestosStorageService, 'obtenerPresupuestos').mockReturnValue([
        { id: 'pres-1' } as any,
        { id: 'pres-2' } as any,
      ])
      const spyGuardar = vi
        .spyOn(presupuestosStorageService, 'guardarPresupuestos')
        .mockResolvedValue(true as any)

      await deleteTreatmentPlan('pres-1')
      expect(spyGuardar).toHaveBeenCalledWith([{ id: 'pres-2' }])
    })
  })
})
