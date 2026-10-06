import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationCenter } from './NotificationCenter'
import { notificationService } from '../../infrastructure/notification/notificationService'

describe('NotificationCenter (Blueprint 02)', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<NotificationCenter isOpen={false} onClose={vi.fn()} />)
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay notificaciones', () => {
    notificationService.limpiar()
    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Sin notificaciones pendientes')).toBeInTheDocument()
  })

  it('muestra notificaciones agrupadas cuando existen', () => {
    notificationService.limpiar()
    notificationService.mostrar('Error crítico en base de datos', { tipo: 'error', titulo: 'Fallo Crítico' })
    notificationService.mostrar('Cita confirmada por paciente', { tipo: 'success', titulo: 'Operación Exitosa' })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Críticas/i)).toBeInTheDocument()
    expect(screen.getByText('Error crítico en base de datos')).toBeInTheDocument()
    expect(screen.getByText(/Informativas/i)).toBeInTheDocument()
    expect(screen.getByText('Cita confirmada por paciente')).toBeInTheDocument()
  })

  it('llama a onClose al presionar botón de cerrar', () => {
    const onClose = vi.fn()
    render(<NotificationCenter isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: /cerrar notificaciones/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
