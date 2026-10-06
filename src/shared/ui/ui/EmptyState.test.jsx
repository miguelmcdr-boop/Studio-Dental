/**
 * Tests — EmptyState (F10-A4 + F7-28 accesibilidad)
 *
 * Verifica:
 * - Renderizado de título, descripción y CTA
 * - Atributos de accesibilidad (aria-hidden en icono)
 * - Variante compacta
 * - Props rest se propagan correctamente
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { Armchair } from 'lucide-react'

describe('EmptyState', () => {
  it('renderiza título y descripción', () => {
    render(
      <EmptyState
        icon={Armchair}
        title="Sin citas agendadas"
        description="Disponible para reservas"
      />
    )
    expect(screen.getByText('Sin citas agendadas')).toBeInTheDocument()
    expect(screen.getByText('Disponible para reservas')).toBeInTheDocument()
  })

  it('renderiza CTA cuando se provee', () => {
    render(
      <EmptyState
        title="Vacío"
        action={<button>Acción</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'Acción' })).toBeInTheDocument()
  })

  it('agrega aria-hidden al contenedor del icono', () => {
    const { container } = render(
      <EmptyState icon={Armchair} title="Test" />
    )
    // El primer div con aria-hidden="true" es el contenedor del icono
    const iconContainer = container.querySelector('[aria-hidden="true"]')
    expect(iconContainer).toBeInTheDocument()
  })

  it('aplica clase compact correctamente', () => {
    const { container } = render(
      <EmptyState compact title="Test" />
    )
    // En modo compact, el padding es py-8 px-4 (no py-14 px-6)
    const root = container.firstChild
    expect(root.className).toContain('py-8')
    expect(root.className).not.toContain('py-14')
  })

  it('propaga props rest al elemento raíz (F7-28)', () => {
    render(
      <EmptyState
        title="Test"
        role="status"
        aria-live="polite"
        data-testid="empty-state"
      />
    )
    const root = screen.getByTestId('empty-state')
    expect(root).toHaveAttribute('role', 'status')
    expect(root).toHaveAttribute('aria-live', 'polite')
  })

  it('no renderiza icono si no se provee', () => {
    const { container } = render(
      <EmptyState title="Sin icono" />
    )
    // No debe haber contenedor con aria-hidden (el del icono)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})
