/**
 * Tests — DispositivosModal (Blueprint 03 Hotfix)
 * Valida apertura/cierre, renderizado de dispositivos activos y cierre de sesión remota.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DispositivosModal } from './DispositivosModal'

describe('DispositivosModal (Blueprint 03)', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<DispositivosModal isOpen={false} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza título y dispositivos activos cuando isOpen es true', () => {
    render(<DispositivosModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: /dispositivos activos/i })).toBeInTheDocument()
    expect(screen.getByText(/MacBook Pro — Recepción/)).toBeInTheDocument()
    expect(screen.getByText('ESTA SESIÓN')).toBeInTheDocument()
    expect(screen.getByText(/iPad Pro — Box 3/)).toBeInTheDocument()
  })

  it('permite cerrar sesión en dispositivo remoto', () => {
    render(<DispositivosModal isOpen={true} onClose={vi.fn()} />)

    const cerrarBtn = screen.getByRole('button', { name: /cerrar sesión en ipad pro — box 3/i })
    expect(cerrarBtn).toBeInTheDocument()
    fireEvent.click(cerrarBtn)

    expect(screen.queryByText(/iPad Pro — Box 3/)).not.toBeInTheDocument()
    expect(screen.getByText('1 sesión activa')).toBeInTheDocument()
  })

  it('cierra el modal al pulsar el botón cerrar o tecla Escape', () => {
    const onClose = vi.fn()
    render(<DispositivosModal isOpen={true} onClose={onClose} />)

    const closeBtn = screen.getByRole('button', { name: /cerrar$/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
