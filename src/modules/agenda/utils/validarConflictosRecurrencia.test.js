import { describe, it, expect, vi } from 'vitest'
import { confirmarConflictosRecurrencia } from './validarConflictosRecurrencia'

describe('confirmarConflictosRecurrencia', () => {
  it('retorna true si no hay citas con conflicto', async () => {
    const mockValidar = vi.fn().mockReturnValue({ valido: true, conflictos: [] })
    const result = await confirmarConflictosRecurrencia([{}], [], mockValidar)
    expect(result).toBe(true)
  })

  it('muestra mensaje con total de conflictos detectados y pide confirmacion', async () => {
    const mockValidar = vi.fn().mockReturnValue({
      valido: false,
      conflictos: [{ fecha: '2026-10-01', horaInicio: '10:00', pacienteNombre: 'Juan', boxAsignado: 'Box 1' }]
    })
    const mockConfirm = vi.fn().mockResolvedValue(true)
    const result = await confirmarConflictosRecurrencia([{}], [], mockValidar, mockConfirm)
    expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Conflicto de horario'
    }))
    expect(result).toBe(true)
  })
})
