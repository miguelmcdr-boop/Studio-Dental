import { describe, it, expect, vi } from 'vitest'
import { validarConflictoCitaUnica } from './validarConflictoCitaUnica'

describe('validarConflictoCitaUnica', () => {
  it('retorna true si validarFn indica que no hay conflictos', async () => {
    const mockValidar = vi.fn().mockReturnValue({ valido: true, conflictos: [] })
    const result = await validarConflictoCitaUnica({}, [], mockValidar)
    expect(result).toBe(true)
  })

  it('llama a confirmFn y retorna su decision si hay conflictos', async () => {
    const mockValidar = vi.fn().mockReturnValue({
      valido: false,
      conflictos: [{ fecha: '2026-10-01', horaInicio: '10:00', pacienteNombre: 'Juan', boxAsignado: 'Box 1' }]
    })
    const mockConfirm = vi.fn().mockResolvedValue(true)
    const result = await validarConflictoCitaUnica({}, [], mockValidar, mockConfirm)
    expect(mockConfirm).toHaveBeenCalled()
    expect(result).toBe(true)
  })
})
