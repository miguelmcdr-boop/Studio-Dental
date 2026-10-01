/**
 * Tests — AppDialogProvider (F10-C3.1)
 */
import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppDialogProvider } from './AppDialogProvider'
import { useDialogStore } from '../store/dialogStore'

describe('AppDialogProvider (F10-C3.1)', () => {
  beforeEach(() => {
    useDialogStore.setState({ dialog: null })
  })

  it('no renderiza nada si no hay diálogo abierto', () => {
    const { container } = render(<AppDialogProvider />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza ConfirmDialog cuando hay diálogo de tipo confirm', () => {
    const { openDialog } = useDialogStore.getState()
    const promise = openDialog({
      type: 'confirm',
      title: '¿Eliminar paciente?',
      description: 'Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    })

    render(<AppDialogProvider />)

    expect(screen.getByText('¿Eliminar paciente?')).toBeInTheDocument()
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()

    // Cerrar para no dejar Promise pendiente
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    return promise
  })

  it('resuelve con true al hacer click en confirmar', async () => {
    const { openDialog } = useDialogStore.getState()
    const promise = openDialog({
      type: 'confirm',
      title: 'Test',
      confirmText: 'OK',
    })

    render(<AppDialogProvider />)

    fireEvent.click(screen.getByRole('button', { name: /ok/i }))

    const result = await promise
    expect(result).toBe(true)
  })

  it('resuelve con false al hacer click en cancelar', async () => {
    const { openDialog } = useDialogStore.getState()
    const promise = openDialog({
      type: 'confirm',
      title: 'Test',
      cancelText: 'No',
    })

    render(<AppDialogProvider />)

    fireEvent.click(screen.getByRole('button', { name: /no/i }))

    const result = await promise
    expect(result).toBe(false)
  })

  it('para alert no muestra botón de cancelar', () => {
    const { openDialog } = useDialogStore.getState()
    const promise = openDialog({
      type: 'alert',
      title: 'Aviso',
      description: 'Algo pasó',
      variant: 'error',
      confirmText: 'Entendido',
    })

    render(<AppDialogProvider />)

    expect(screen.getByText('Aviso')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entendido/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /entendido/i }))
    return promise
  })
})
