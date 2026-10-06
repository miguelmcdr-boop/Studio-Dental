import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AtajosTecladoModal } from './AtajosTecladoModal'

describe('AtajosTecladoModal (Blueprint 02)', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<AtajosTecladoModal isOpen={false} onClose={vi.fn()} />)
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('renderiza títulos, atajos y categorías cuando isOpen es true', () => {
    render(<AtajosTecladoModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: /atajos de teclado/i })).toBeInTheDocument()
    expect(screen.getByText('NAVEGACIÓN')).toBeInTheDocument()
    expect(screen.getByText('CREACIÓN')).toBeInTheDocument()
    expect(screen.getByText('VISTA')).toBeInTheDocument()
    expect(screen.getByText('SESIÓN & VENTANAS')).toBeInTheDocument()
  })

  it('llama a onClose al presionar botón de cerrar', () => {
    const onClose = vi.fn()
    render(<AtajosTecladoModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: /cerrar panel de atajos/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('llama a onClose al presionar tecla Escape', () => {
    const onClose = vi.fn()
    render(<AtajosTecladoModal isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
