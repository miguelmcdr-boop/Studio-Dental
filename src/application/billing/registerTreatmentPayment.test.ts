import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  registrarPagoTratamiento,
  eliminarPagoTratamiento,
  obtenerAbonosPaciente,
} from './registerTreatmentPayment'
import { pacientesStorageService } from '../../domains/clinical/patient'
import * as paymentDomain from '../../domains/billing/payment'

describe('registerTreatmentPayment (Application Service)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('obtenerAbonosPaciente', () => {
    it('debe retornar lista de abonos del paciente', () => {
      vi.spyOn(pacientesStorageService, 'obtenerItem').mockReturnValue([
        { id: 1, monto: 50000, metodoPago: 'Efectivo' },
      ])
      const abonos = obtenerAbonosPaciente('pac-1')
      expect(abonos).toHaveLength(1)
      expect(abonos[0].monto).toBe(50000)
    })

    it('debe retornar array vacío si no hay pacienteId', () => {
      expect(obtenerAbonosPaciente('')).toEqual([])
    })
  })

  describe('registrarPagoTratamiento', () => {
    it('debe crear el abono en la ficha y sincronizarlo en pagos globales', () => {
      const spyGuardarItem = vi
        .spyOn(pacientesStorageService, 'guardarItem')
        .mockImplementation(() => {})
      const spyCrearPago = vi
        .spyOn(paymentDomain, 'crearPagoDesdeAbono')
        .mockReturnValue(true)

      const paciente = { id: 'pac-123', nombre: 'Juan Pérez' }
      const res = registrarPagoTratamiento({
        paciente,
        monto: 35000,
        metodoPago: 'Tarjeta Débito',
        fecha: '04-10-2026',
        abonosPrevios: [],
      })

      expect(res.abono.monto).toBe(35000)
      expect(res.abono.metodoPago).toBe('Tarjeta Débito')
      expect(res.abono.pacienteNombre).toBe('Juan Pérez')
      expect(res.abonosActualizados).toHaveLength(1)

      expect(spyGuardarItem).toHaveBeenCalledWith(
        'abonos_pac-123',
        res.abonosActualizados
      )
      expect(spyCrearPago).toHaveBeenCalledWith(paciente, res.abono)
    })
  })

  describe('eliminarPagoTratamiento', () => {
    it('debe eliminar el abono de la ficha y anular el pago global asociado', async () => {
      const spyGuardarItem = vi
        .spyOn(pacientesStorageService, 'guardarItem')
        .mockImplementation(() => {})
      vi.spyOn(paymentDomain.pagosStorageService, 'obtenerPagos').mockReturnValue([
        {
          id: 'abono-99',
          pacienteId: 'pac-1',
          monto: 20000,
          estado: 'Emitido',
        },
      ])
      const spyGuardarPagos = vi
        .spyOn(paymentDomain.pagosStorageService, 'guardarPagos')
        .mockResolvedValue(true as any)

      const res = await eliminarPagoTratamiento({
        pacienteId: 'pac-1',
        idAbono: 'abono-99',
        abonosPrevios: [
          { id: 'abono-99', monto: 20000 },
          { id: 'abono-100', monto: 10000 },
        ],
      })

      expect(res.success).toBe(true)
      expect(res.pagoGlobalAnulado).toBe(true)
      expect(res.abonosActualizados).toHaveLength(1)
      expect(res.abonosActualizados[0].id).toBe('abono-100')

      expect(spyGuardarItem).toHaveBeenCalledWith('abonos_pac-1', res.abonosActualizados)
      expect(spyGuardarPagos).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'abono-99',
          estado: 'Anulado',
          motivoAnulacion: 'Abono eliminado desde Plan de Tratamiento',
        }),
      ])
    })

    it('debe manejar abonos que no tienen pago global asociado', async () => {
      vi.spyOn(pacientesStorageService, 'guardarItem').mockImplementation(() => {})
      vi.spyOn(paymentDomain.pagosStorageService, 'obtenerPagos').mockReturnValue([])
      const spyGuardarPagos = vi.spyOn(paymentDomain.pagosStorageService, 'guardarPagos')

      const res = await eliminarPagoTratamiento({
        pacienteId: 'pac-1',
        idAbono: 'abono-solo-local',
        abonosPrevios: [{ id: 'abono-solo-local', monto: 5000 }],
      })

      expect(res.success).toBe(true)
      expect(res.pagoGlobalAnulado).toBe(false)
      expect(res.abonosActualizados).toHaveLength(0)
      expect(spyGuardarPagos).not.toHaveBeenCalled()
    })
  })
})
