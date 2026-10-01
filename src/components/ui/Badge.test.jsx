/**
 * Tests — Badge component (Fase 2 DentikOS Design System)
 *
 * Valida variantes semánticas (status-*, success, danger, warning),
 * sizes, dot indicator y accesibilidad.
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import { CheckCircle } from 'lucide-react'

describe('Badge (DentikOS)', () => {
  it('renderiza texto correctamente', () => {
    render(<Badge>Activo</Badge>)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('soporta variante status-success', () => {
    const { container } = render(<Badge variant="status-success">Confirmado</Badge>)
    const badge = container.querySelector('span')
    expect(badge.className).toContain('text-status-success')
  })

  it('soporta variante status-danger y danger', () => {
    const { container: c1 } = render(<Badge variant="status-danger">Urgente</Badge>)
    expect(c1.querySelector('span').className).toContain('text-status-danger')

    const { container: c2 } = render(<Badge variant="danger">Error</Badge>)
    expect(c2.querySelector('span').className).toContain('text-status-danger')
  })

  it('soporta variante status-warning', () => {
    const { container } = render(<Badge variant="status-warning">Pendiente</Badge>)
    expect(container.querySelector('span').className).toContain('border-status-warning')
  })

  it('soporta dot indicator con role="status"', () => {
    render(<Badge dot variant="success">En línea</Badge>)
    const badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    expect(badge.querySelector('.rounded-full')).toBeInTheDocument()
  })

  it('soporta icono cuando no hay dot', () => {
    const { container } = render(<Badge icon={CheckCircle}>Completado</Badge>)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('aplica clases de tamaño sm y md', () => {
    const { container: c1 } = render(<Badge size="sm">Pequeño</Badge>)
    expect(c1.querySelector('span').className).toContain('text-[10px]')

    const { container: c2 } = render(<Badge size="md">Mediano</Badge>)
    expect(c2.querySelector('span').className).toContain('text-xs')
  })
})
