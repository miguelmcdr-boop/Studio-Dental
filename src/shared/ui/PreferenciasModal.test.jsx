/**
 * Tests — PreferenciasModal (Blueprint 03 Hotfix)
 * Valida apertura/cierre, renderizado de las 4 tabs y cambio de tab.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PreferenciasModal } from './PreferenciasModal'

describe('PreferenciasModal (Blueprint 03)', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<PreferenciasModal isOpen={false} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza título y las 4 tabs cuando isOpen es true', () => {
    render(<PreferenciasModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: /preferencias/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tema/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /idioma/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notificaciones/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /accesibilidad/i })).toBeInTheDocument()
  })

  it('permite cambiar entre tabs y muestra el contenido correspondiente', () => {
    render(<PreferenciasModal isOpen={true} onClose={vi.fn()} />)

    // Tab Tema por defecto
    expect(screen.getByText('Selecciona el modo de visualización:')).toBeInTheDocument()

    // Cambiar a Idioma
    fireEvent.click(screen.getByRole('button', { name: /idioma/i }))
    expect(screen.getByText('Idioma de la interfaz:')).toBeInTheDocument()
    expect(screen.getByText('Español (Chile)')).toBeInTheDocument()

    // Cambiar a Notificaciones
    fireEvent.click(screen.getByRole('button', { name: /notificaciones/i }))
    expect(screen.getByText('Notificaciones críticas')).toBeInTheDocument()

    // Cambiar a Accesibilidad
    fireEvent.click(screen.getByRole('button', { name: /accesibilidad/i }))
    expect(screen.getByText('Feedback sonoro')).toBeInTheDocument()
    expect(screen.getByText('Reducir movimiento')).toBeInTheDocument()
  })

  it('cierra el modal al hacer click en el botón cerrar o presionar Escape', () => {
    const onClose = vi.fn()
    render(<PreferenciasModal isOpen={true} onClose={onClose} />)

    const closeBtn = screen.getByRole('button', { name: /cerrar/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
