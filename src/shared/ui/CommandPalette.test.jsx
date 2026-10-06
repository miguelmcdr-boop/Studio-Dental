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

  // Regresiones Workstream 3 — Navegación Omnicanal
  it('seleccionar resultado de módulo llama onNavigate con el nombre', () => {
    const onNavigate = vi.fn()
    const handleSelect = vi.fn((item) => item.ejecutar())
    const moduloItem = {
      id: 'mod-agenda',
      label: 'Agenda',
      tipo: 'modulo',
      ejecutar: () => onNavigate('Agenda'),
    }

    render(
      <CommandPalette
        {...defaultProps}
        allResults={[moduloItem]}
        handleSelect={handleSelect}
      />
    )

    fireEvent.click(screen.getByText('Agenda'))
    expect(handleSelect).toHaveBeenCalledWith(moduloItem)
    expect(onNavigate).toHaveBeenCalledWith('Agenda')
  })

  it("seleccionar acción 'nueva-cita' navega a Agenda", () => {
    const onNavigate = vi.fn()
    const handleSelect = vi.fn((item) => item.ejecutar())
    const accionItem = {
      id: 'nueva-cita',
      label: 'Nueva cita',
      tipo: 'accion',
      ejecutar: () => onNavigate('Agenda'),
    }

    render(
      <CommandPalette
        {...defaultProps}
        allResults={[accionItem]}
        handleSelect={handleSelect}
      />
    )

    fireEvent.click(screen.getByText('Nueva cita'))
    expect(handleSelect).toHaveBeenCalledWith(accionItem)
    expect(onNavigate).toHaveBeenCalledWith('Agenda')
  })

  it('Enter sobre resultado de módulo tiene el mismo comportamiento que click', () => {
    const onNavigate = vi.fn()
    const handleSelect = vi.fn((item) => item.ejecutar())
    const moduloItem = {
      id: 'mod-pacientes',
      label: 'Pacientes',
      tipo: 'modulo',
      ejecutar: () => onNavigate('Pacientes'),
    }

    render(
      <CommandPalette
        {...defaultProps}
        allResults={[moduloItem]}
        selectedIndex={0}
        handleSelect={handleSelect}
      />
    )

    const input = screen.getByRole('textbox', { name: /entrada de búsqueda/i })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleSelect).toHaveBeenCalledWith(moduloItem)
    expect(onNavigate).toHaveBeenCalledWith('Pacientes')
  })

  it("seleccionar configuración 'tema-oscuro' abre preferencias o cambia tema", () => {
    const onOpenPreferencias = vi.fn()
    const handleSelect = vi.fn((item) => item.ejecutar())
    const configItem = {
      id: 'tema-oscuro',
      label: 'Tema Oscuro',
      tipo: 'configuracion',
      ejecutar: () => onOpenPreferencias(),
    }

    render(
      <CommandPalette
        {...defaultProps}
        allResults={[configItem]}
        handleSelect={handleSelect}
      />
    )

    fireEvent.click(screen.getByText('Tema Oscuro'))
    expect(handleSelect).toHaveBeenCalledWith(configItem)
    expect(onOpenPreferencias).toHaveBeenCalled()
  })
})
