import { describe, it, expect } from 'vitest'
import { detectarConflictoBloqueo } from './agendaConflictos'

describe('detectarConflictoBloqueo (F10-C3.13)', () => {
  const bloqueoBase = {
    fecha: '2026-09-11',
    horaInicio: '13:00',
    horaFin: '14:00',
    boxAsignado: 'Sillón 1 - Odontología General',
  }

  it('retorna hayConflicto: false si no hay citas', () => {
    const result = detectarConflictoBloqueo(bloqueoBase, [])
    expect(result.hayConflicto).toBe(false)
    expect(result.citasConflicto).toEqual([])
  })

  it('retorna hayConflicto: false si nuevoBloqueo es null', () => {
    const result = detectarConflictoBloqueo(null, [{ horaInicio: '13:00', horaFin: '14:00' }])
    expect(result.hayConflicto).toBe(false)
  })

  it('detecta conflicto con cita existente en mismo box y horario solapado', () => {
    const citas = [
      {
        id: 1,
        fecha: '2026-09-11',
        horaInicio: '13:30',
        horaFin: '14:30',
        boxAsignado: 'Sillón 1 - Odontología General',
        estado: 'Agendado',
        pacienteNombre: 'Juan Pérez',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoBase, citas)
    expect(result.hayConflicto).toBe(true)
    expect(result.citasConflicto).toHaveLength(1)
    expect(result.citasConflicto[0].id).toBe(1)
  })

  it('no detecta conflicto en box diferente', () => {
    const citas = [
      {
        id: 2,
        fecha: '2026-09-11',
        horaInicio: '13:30',
        horaFin: '14:30',
        boxAsignado: 'Sillón 2 - Higiene & Ortodoncia',
        estado: 'Agendado',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoBase, citas)
    expect(result.hayConflicto).toBe(false)
  })

  it('no detecta conflicto en fecha diferente', () => {
    const citas = [
      {
        id: 3,
        fecha: '2026-09-12',
        horaInicio: '13:30',
        horaFin: '14:30',
        boxAsignado: 'Sillón 1 - Odontología General',
        estado: 'Agendado',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoBase, citas)
    expect(result.hayConflicto).toBe(false)
  })

  it('no detecta conflicto en rangos contiguos (no solapados)', () => {
    const citas = [
      {
        id: 4,
        fecha: '2026-09-11',
        horaInicio: '14:00',
        horaFin: '15:00',
        boxAsignado: 'Sillón 1 - Odontología General',
        estado: 'Agendado',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoBase, citas)
    expect(result.hayConflicto).toBe(false)
  })

  it('detecta conflicto con cita anulada como NO conflicto', () => {
    const citas = [
      {
        id: 5,
        fecha: '2026-09-11',
        horaInicio: '13:30',
        horaFin: '14:30',
        boxAsignado: 'Sillón 1 - Odontología General',
        estado: 'Anulado',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoBase, citas)
    expect(result.hayConflicto).toBe(false)
  })

  it('bloquea con "Todos los Boxes" en bloqueo nuevo → conflicto con cualquier box', () => {
    const bloqueoTodos = { ...bloqueoBase, boxAsignado: 'Todos los Boxes' }
    const citas = [
      {
        id: 6,
        fecha: '2026-09-11',
        horaInicio: '13:30',
        horaFin: '14:30',
        boxAsignado: 'Box 3 - Quirúrgico & Implantes',
        estado: 'Agendado',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoTodos, citas)
    expect(result.hayConflicto).toBe(true)
  })

  it('bloquea con "Todos los Boxes" en cita existente → conflicto con cualquier bloqueo', () => {
    const citas = [
      {
        id: 7,
        fecha: '2026-09-11',
        horaInicio: '13:30',
        horaFin: '14:30',
        boxAsignado: 'Todos los Boxes',
        estado: 'Agendado',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoBase, citas)
    expect(result.hayConflicto).toBe(true)
  })

  it('detecta múltiples conflictos simultáneos', () => {
    const citas = [
      {
        id: 8,
        fecha: '2026-09-11',
        horaInicio: '13:00',
        horaFin: '13:30',
        boxAsignado: 'Sillón 1 - Odontología General',
        estado: 'Agendado',
      },
      {
        id: 9,
        fecha: '2026-09-11',
        horaInicio: '13:45',
        horaFin: '14:15',
        boxAsignado: 'Sillón 1 - Odontología General',
        estado: 'Confirmado',
      },
      {
        id: 10,
        fecha: '2026-09-11',
        horaInicio: '13:30',
        horaFin: '14:00',
        boxAsignado: 'Sillón 2 - Higiene & Ortodoncia',
        estado: 'Agendado',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoBase, citas)
    expect(result.hayConflicto).toBe(true)
    expect(result.citasConflicto).toHaveLength(2)
    const ids = result.citasConflicto.map(c => c.id).sort()
    expect(ids).toEqual([8, 9])
  })

  it('funciona con fechaIso en vez de fecha', () => {
    const bloqueoIso = { ...bloqueoBase, fechaIso: '2026-09-11' }
    const citas = [
      {
        id: 11,
        fechaIso: '2026-09-11',
        horaInicio: '13:30',
        horaFin: '14:30',
        boxAsignado: 'Sillón 1 - Odontología General',
        estado: 'Agendado',
      },
    ]
    const result = detectarConflictoBloqueo(bloqueoIso, citas)
    expect(result.hayConflicto).toBe(true)
  })
})
