import { describe, it, expect } from 'vitest'
import {
  calcularProximaFechaRecurrencia,
  generarCitasRecurrencia,
  validarConflictosRecurrencia,
} from './recurrenciaUtils'

describe('recurrenciaUtils', () => {
  describe('calcularProximaFechaRecurrencia', () => {
    it('retorna null si no hay recurrencia', () => {
      const cita = { fecha: '2026-09-24', recurrencia: 'ninguna' }
      expect(calcularProximaFechaRecurrencia(cita)).toBeNull()
    })

    it('calcula próxima fecha semanal', () => {
      const cita = { fecha: '2026-09-24', recurrencia: 'semanal', frecuencia: 1 }
      expect(calcularProximaFechaRecurrencia(cita)).toBe('2026-10-01')
    })

    it('calcula próxima fecha mensual', () => {
      const cita = { fecha: '2026-09-24', recurrencia: 'mensual', frecuencia: 1 }
      expect(calcularProximaFechaRecurrencia(cita)).toBe('2026-10-24')
    })

    it('calcula próxima fecha anual', () => {
      const cita = { fecha: '2026-09-24', recurrencia: 'anual', frecuencia: 1 }
      expect(calcularProximaFechaRecurrencia(cita)).toBe('2027-09-24')
    })
  })

  describe('generarCitasRecurrencia', () => {
    it('genera 3 citas semanales', () => {
      const citaBase = {
        id: 'cita_1',
        fecha: '2026-09-24',
        horaInicio: '10:00',
        recurrencia: 'semanal',
        frecuencia: 1,
      }
      const citas = generarCitasRecurrencia(citaBase, 3)
      expect(citas).toHaveLength(3)
      expect(citas[0].fecha).toBe('2026-10-01')
      expect(citas[1].fecha).toBe('2026-10-08')
      expect(citas[2].fecha).toBe('2026-10-15')
    })

    it('retorna array vacío si no hay recurrencia', () => {
      const citaBase = { id: 'cita_1', fecha: '2026-09-24', recurrencia: 'ninguna' }
      const citas = generarCitasRecurrencia(citaBase, 5)
      expect(citas).toHaveLength(0)
    })

    it('detiene generación al alcanzar fechaFin', () => {
      const citaBase = {
        id: 'cita_1',
        fecha: '2026-09-24',
        recurrencia: 'semanal',
        frecuencia: 1,
        fechaFin: '2026-10-10',
      }
      const citas = generarCitasRecurrencia(citaBase, 10)
      expect(citas).toHaveLength(2) // 2026-10-01 y 2026-10-08 (2026-10-15 excede fechaFin)
    })
  })

  describe('validarConflictosRecurrencia', () => {
    it('retorna valido: true si no hay conflictos', () => {
      const nuevaCita = { id: 'nueva', fecha: '2026-09-25', horaInicio: '10:00', boxAsignado: 'Box 1' }
      const citasExistentes = [{ id: 'existente', fecha: '2026-09-25', horaInicio: '11:00', boxAsignado: 'Box 1' }]
      const resultado = validarConflictosRecurrencia(nuevaCita, citasExistentes)
      expect(resultado.valido).toBe(true)
      expect(resultado.conflictos).toHaveLength(0)
    })

    it('detecta conflicto de horario', () => {
      const nuevaCita = { id: 'nueva', fecha: '2026-09-25', horaInicio: '10:00', boxAsignado: 'Box 1' }
      const citasExistentes = [{ id: 'existente', fecha: '2026-09-25', horaInicio: '10:00', boxAsignado: 'Box 1' }]
      const resultado = validarConflictosRecurrencia(nuevaCita, citasExistentes)
      expect(resultado.valido).toBe(false)
      expect(resultado.conflictos).toHaveLength(1)
    })
  })
})
