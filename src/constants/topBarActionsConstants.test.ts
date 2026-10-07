import { describe, it, expect, vi } from 'vitest'
import { ACCIONES_POR_MODULO } from './topBarActionsConstants'

describe('topBarActionsConstants — Decisión de producto CEO (WS4)', () => {
  it('en Dashboard: acción primaria es "Nuevo paciente" y secundarias son "Nueva cita" y "Reportes"', () => {
    const dashboard = ACCIONES_POR_MODULO['Dashboard']
    expect(dashboard).toBeDefined()
    expect(dashboard.primaria.label).toBe('Nuevo paciente')
    expect(dashboard.primaria.actionKey).toBe('crearPaciente')

    const labelsSecundarias = dashboard.secundarias.map((s) => s.label)
    expect(labelsSecundarias).toContain('Nueva cita')
    expect(labelsSecundarias).toContain('Reportes')
  })

  it('en Agenda: acción primaria se mantiene como "Nueva cita"', () => {
    const agenda = ACCIONES_POR_MODULO['Agenda']
    expect(agenda).toBeDefined()
    expect(agenda.primaria.label).toBe('Nueva cita')
    expect(agenda.primaria.actionKey).toBe('crearCita')
  })

  it('al disparar abrir_nuevo_paciente se abre el modal', () => {
    const listener = vi.fn()
    window.addEventListener('abrir_nuevo_paciente', listener)
    window.dispatchEvent(new CustomEvent('abrir_nuevo_paciente'))
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('abrir_nuevo_paciente', listener)
  })
})
