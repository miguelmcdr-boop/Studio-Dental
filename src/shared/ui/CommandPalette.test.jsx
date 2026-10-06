import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'

describe('CommandPalette (Blueprint 03)', () => {
  const defaultProps = {
    isOpen: true,
    query: '',
    setQuery: vi.fn(),
    selectedIndex: 0,
    allResults: [
      {
        id: 'pac-1',
        label: 'Juan Pérez',
        sublabel: 'RUT: 12.345.678-9',
        categoria: 'pacientes',
        action: vi.fn(),
      },
      {
        id: 'cita-1',
        label: 'Cita: Juan Pérez',
        sublabel: '14:30',
        categoria: 'citas',
        action: vi.fn(),
      },
      {
        id: 'mod-agenda',
        label: 'Agenda',
        categoria: 'modulos',
        action: vi.fn(),
      },
      {
        id: 'acc-cita',
        label: 'Nueva cita médica',
        categoria: 'acciones',
        action: vi.fn(),
      },
      {
        id: 'cfg-foco',
        label: 'Alternar Modo Foco',
        categoria: 'configuracion',
        action: vi.fn(),
      },
      {
        id: 'doc-pres',
        label: 'Presupuestos clínicos',
        categoria: 'documentos',
        action: vi.fn(),
      },
    ],
    close: vi.fn(),
    selectCurrent: vi.fn(),
    moveUp: vi.fn(),
    moveDown: vi.fn(),
  }

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<CommandPalette {...defaultProps} isOpen={false} />)
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('renderiza resultados en las categorías requeridas', () => {
    render(<CommandPalette {...defaultProps} />)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('Cita: Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('Agenda')).toBeInTheDocument()
    expect(screen.getByText('Nueva cita médica')).toBeInTheDocument()
    expect(screen.getByText('Alternar Modo Foco')).toBeInTheDocument()
    expect(screen.getByText('Presupuestos clínicos')).toBeInTheDocument()
  })

  it('maneja eventos de teclado (Escape, Enter, Flechas)', () => {
    render(<CommandPalette {...defaultProps} />)
    const input = screen.getByRole('textbox', { name: /entrada de búsqueda/i })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(defaultProps.moveDown).toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(defaultProps.moveUp).toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(defaultProps.selectCurrent).toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(defaultProps.close).toHaveBeenCalled()
  })
})
