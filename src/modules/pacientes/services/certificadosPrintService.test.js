import { describe, it, expect, vi, beforeEach } from 'vitest'
import { imprimirCertificadoAislado } from './certificadosPrintService'

describe('certificadosPrintService (M2a)', () => {
  beforeEach(() => {
    document.body.className = ''
    window.print = vi.fn()
  })

  it('agrega clase de aislamiento y llama window.print', () => {
    imprimirCertificadoAislado()
    expect(document.body.classList.contains('print-cert-activo')).toBe(true)
    expect(window.print).toHaveBeenCalledTimes(1)
  })

  it('remueve la clase al disparar afterprint', () => {
    imprimirCertificadoAislado()
    window.dispatchEvent(new Event('afterprint'))
    expect(document.body.classList.contains('print-cert-activo')).toBe(false)
  })

  it('remueve la clase si window.print lanza error', () => {
    window.print = vi.fn(() => { throw new Error('sin impresora') })
    imprimirCertificadoAislado()
    expect(document.body.classList.contains('print-cert-activo')).toBe(false)
  })
})
