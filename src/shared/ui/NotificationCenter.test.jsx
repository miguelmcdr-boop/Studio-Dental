import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationCenter } from './NotificationCenter'
import { notificationService } from '../../infrastructure/notification/notificationService'

describe('NotificationCenter (Blueprint 03)', () => {
  beforeEach(() => {
    notificationService.limpiar()
  })

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<NotificationCenter isOpen={false} onClose={vi.fn()} />)
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay notificaciones', () => {
    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Sin notificaciones pendientes')).toBeInTheDocument()
  })

  it('muestra notificaciones agrupadas en 3 severidades del Blueprint', () => {
    notificationService.mostrar('Error de conexión con RLS', { tipo: 'error', titulo: 'Fallo Crítico' })
    notificationService.mostrar('Sincronización completada', { tipo: 'info', titulo: 'Operación Exitosa' })
    notificationService.mostrar('Cita confirmada', { tipo: 'success', titulo: 'Informativa' })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Críticas/i)).toBeInTheDocument()
    expect(screen.getByText('Error de conexión con RLS')).toBeInTheDocument()
    expect(screen.getByText(/Operativas/i)).toBeInTheDocument()
    expect(screen.getByText('Sincronización completada')).toBeInTheDocument()
    expect(screen.getByText(/Informativas/i)).toBeInTheDocument()
    expect(screen.getByText('Cita confirmada')).toBeInTheDocument()
  })

  it('marcar todas descarta operativas pero preserva las críticas', () => {
    notificationService.mostrar('Alerta crítica médica', { tipo: 'error' })
    notificationService.mostrar('Aviso operativo', { tipo: 'info' })

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} />)
    const marcarTodasBtn = screen.getByRole('button', { name: /marcar todas/i })
    fireEvent.click(marcarTodasBtn)

    // La crítica debe permanecer
    expect(screen.getByText('Alerta crítica médica')).toBeInTheDocument()
    // La operativa debe haber sido descartada
    expect(screen.queryByText('Aviso operativo')).not.toBeInTheDocument()
  })

  it('llama a onClose al presionar botón de cerrar', () => {
    const onClose = vi.fn()
    render(<NotificationCenter isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: /cerrar notificaciones/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
