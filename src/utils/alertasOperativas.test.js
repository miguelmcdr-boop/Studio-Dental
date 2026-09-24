import { describe, it, expect } from 'vitest'
import { obtenerAlertasOperativas } from './alertasOperativas'

describe('alertasOperativas', () => {
  describe('obtenerAlertasOperativas', () => {
    it('retorna array vacío si no hay alertas', () => {
      const alertas = obtenerAlertasOperativas([], [], [])
      expect(alertas).toEqual([])
    })

    it('detecta pacientes con deuda > $50.000', () => {
      const presupuestos = [
        { pacienteId: 'pac_1', total: 100000, estado: 'Aceptado' },
      ]
      const pagos = [{ pacienteId: 'pac_1', monto: 30000, estado: 'Pagado' }]
      const alertas = obtenerAlertasOperativas([], pagos, presupuestos)
      expect(alertas).toHaveLength(1)
      expect(alertas[0].tipo).toBe('deuda_pendiente')
      expect(alertas[0].monto).toBe(70000)
    })

    it('ordena alertas por severidad (alta > media > baja)', () => {
      const citas = [
        { fecha: new Date().toISOString().split('T')[0], horaInicio: '10:00', pacienteNombre: 'Juan', boxAsignado: 'Box 1', estado: 'Completado' },
      ]
      const presupuestos = [{ pacienteId: 'pac_1', total: 100000, estado: 'Aceptado' }]
      const pagos = []
      const alertas = obtenerAlertasOperativas(citas, pagos, presupuestos)
      expect(alertas[0].severidad).toBe('alta') // deuda pendiente
    })
  })
})
