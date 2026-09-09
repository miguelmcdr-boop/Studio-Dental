/**
 * Tests — CustomSelect (F10-A7)
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CustomSelect } from './CustomSelect'
import { Utensils, Wrench, GraduationCap } from 'lucide-react'

const mockOptions = [
  { value: 'almuerzo', label: 'Horario de Almuerzo', icon: Utensils },
  { value: 'mantenimiento', label: 'Mantenimiento Técnico', icon: Wrench },
  { value: 'capacitacion', label: 'Capacitación / Evento', icon: GraduationCap },
]

describe('CustomSelect (F10-A7)', () => {
  it('renderiza el label', () => {
    render(<CustomSelect label="Motivo" options={mockOptions} value="" onChange={() => {}} />)
    expect(screen.getByText('Motivo')).toBeInTheDocument()
  })

  it('renderiza el placeholder cuando no hay valor', () => {
    render(<CustomSelect label="Motivo" options={mockOptions} value="" onChange={() => {}} placeholder="Seleccionar..." />)
    expect(screen.getByText('Seleccionar...')).toBeInTheDocument()
  })

  it('renderiza el valor seleccionado', () => {
    render(<CustomSelect label="Motivo" options={mockOptions} value="almuerzo" onChange={() => {}} />)
    expect(screen.getByText('Horario de Almuerzo')).toBeInTheDocument()
  })

  it('abre el dropdown al hacer click', () => {
    render(<CustomSelect label="Motivo" options={mockOptions} value="" onChange={() => {}} />)
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('selecciona una opción al hacer click', () => {
    const handleChange = vi.fn()
    render(<CustomSelect label="Motivo" options={mockOptions} value="" onChange={handleChange} />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Mantenimiento Técnico'))
    expect(handleChange).toHaveBeenCalledWith('mantenimiento')
  })

  it('navega con ArrowDown y Enter', () => {
    const handleChange = vi.fn()
    render(<CustomSelect label="Motivo" options={mockOptions} value="" onChange={handleChange} />)
    const trigger = screen.getByRole('combobox')
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(handleChange).toHaveBeenCalledWith('mantenimiento')
  })

  it('cierra con Escape', () => {
    render(<CustomSelect label="Motivo" options={mockOptions} value="" onChange={() => {}} />)
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('respeta disabled', () => {
    render(<CustomSelect label="Motivo" options={mockOptions} value="" onChange={() => {}} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
