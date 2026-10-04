import { describe, it, expect, vi } from 'vitest'
import { confirmarConDialogo } from './confirmarConDialogo'

describe('confirmarConDialogo', () => {
  it('usa confirmFn cuando esta disponible', async () => {
    const mockConfirm = vi.fn().mockResolvedValue(true)
    const result = await confirmarConDialogo('Mensaje de prueba', mockConfirm)
    expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Conflicto de horario',
      description: 'Mensaje de prueba'
    }))
    expect(result).toBe(true)
  })

  it('hace fallback a window.confirm si confirmFn es null', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const result = await confirmarConDialogo('Alerta')
    expect(confirmSpy).toHaveBeenCalledWith('Alerta')
    expect(result).toBe(true)
    confirmSpy.mockRestore()
  })
})
