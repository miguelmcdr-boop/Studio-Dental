/**
 * Tests unitarios de conflictosAgenda (F5-05).
 */
import { describe, it, expect } from 'vitest'
import { detectarConflictoAgenda, convertirAHoras } from './conflictosAgenda'

describe('conflictosAgenda', () => {
  describe('convertirAHoras', () => {
    it('debe convertir fecha+hora a timestamps', () => {
      const resultado = convertirAHoras({
        fecha: '2026-08-14',
        horaInicio: '10:00',
        duracionMinutos: 30
      })

      expect(resultado.inicioMs).toBeDefined()
      expect(resultado.finMs).toBeDefined()
      expect(resultado.finMs - resultado.inicioMs).toBe(30 * 60 * 1000)
    })

    it('debe retornar null si falta fecha', () => {
      expect(convertirAHoras({ horaInicio: '10:00' })).toBeNull()
    })

    it('debe retornar null si falta horaInicio', () => {
      expect(convertirAHoras({ fecha: '2026-08-14' })).toBeNull()
    })

    it('debe usar 30 minutos por defecto si no se especifica duración', () => {
      const resultado = convertirAHoras({
        fecha: '2026-08-14',
        horaInicio: '10:00'
      })
      expect(resultado.finMs - resultado.inicioMs).toBe(30 * 60 * 1000)
    })
  })

  describe('detectarConflictoAgenda', () => {
    const pacienteId = 'pac-1'

    const citaBase = (horaInicio, duracionMinutos = 30, overrides = {}) => ({
      id: `c-${Math.random()}`,
      pacienteId,
      fecha: '2026-08-14',
      horaInicio,
      duracionMinutos,
      estado: 'Agendada',
      ...overrides
    })

    it('debe detectar conflicto cuando citas se superponen', () => {
      const existente = citaBase('10:00', 60) // 10:00-11:00
      const nueva = citaBase('10:30', 30) // 10:30-11:00 (se superpone)

      const result = detectarConflictoAgenda(nueva, [existente])

      expect(result.hayConflicto).toBe(true)
      expect(result.citasConflictivas).toHaveLength(1)
    })

    it('no debe detectar conflicto si citas no se superponen', () => {
      const existente = citaBase('10:00', 30) // 10:00-10:30
      const nueva = citaBase('11:00', 30) // 11:00-11:30

      const result = detectarConflictoAgenda(nueva, [existente])

      expect(result.hayConflicto).toBe(false)
    })

    it('no debe detectar conflicto si son pacientes diferentes', () => {
      const existente = citaBase('10:00', 60, { pacienteId: 'pac-1' })
      const nueva = citaBase('10:00', 60, { pacienteId: 'pac-2' })

      const result = detectarConflictoAgenda(nueva, [existente])

      expect(result.hayConflicto).toBe(false)
    })

    it('debe ignorar citas canceladas existentes', () => {
      const existente = citaBase('10:00', 60, { estado: 'Cancelada' })
      const nueva = citaBase('10:30', 30)

      const result = detectarConflictoAgenda(nueva, [existente])

      expect(result.hayConflicto).toBe(false)
    })

    it('debe ignorar si la nueva cita está cancelada', () => {
      const existente = citaBase('10:00', 60)
      const nueva = citaBase('10:30', 30, { estado: 'Cancelada' })

      const result = detectarConflictoAgenda(nueva, [existente])

      expect(result.hayConflicto).toBe(false)
    })

    it('debe ignorar la misma cita (edición)', () => {
      const cita = citaBase('10:00', 60)
      const mismaEditada = { ...cita, horaInicio: '10:15' }

      const result = detectarConflictoAgenda(mismaEditada, [cita])

      expect(result.hayConflicto).toBe(false)
    })

    it('debe manejar duraciones variables', () => {
      const existente = citaBase('09:00', 120) // 9:00-11:00 (larga)
      const nueva = citaBase('10:30', 15) // 10:30-10:45 (corta, dentro)

      const result = detectarConflictoAgenda(nueva, [existente])

      expect(result.hayConflicto).toBe(true)
    })

    it('no debe fallar si citasExistentes es vacío', () => {
      const nueva = citaBase('10:00')
      const result = detectarConflictoAgenda(nueva, [])

      expect(result.hayConflicto).toBe(false)
    })

    it('no debe fallar si nuevaCita no tiene pacienteId', () => {
      const existente = citaBase('10:00')
      const nueva = { fecha: '2026-08-14', horaInicio: '10:00' }

      const result = detectarConflictoAgenda(nueva, [existente])

      expect(result.hayConflicto).toBe(false)
    })

    it('debe detectar múltiples conflictos', () => {
      const existentes = [
        citaBase('10:00', 60), // 10:00-11:00
        citaBase('10:30', 60) // 10:30-11:30
      ]
      const nueva = citaBase('10:15', 60) // 10:15-11:15

      const result = detectarConflictoAgenda(nueva, existentes)

      expect(result.hayConflicto).toBe(true)
      expect(result.citasConflictivas).toHaveLength(2)
    })
  })
})
