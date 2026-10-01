/**
 * Tests — DentikOSMicroSeal component (Fase 3 DentikOS Design System)
 *
 * Valida glifo molar 14x14, trazo áureo, wordmark tipográfico y leyenda normativa.
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DentikOSMicroSeal } from './DentikOSMicroSeal'

describe('DentikOSMicroSeal', () => {
  it('renderiza el contenedor principal con data-testid', () => {
    render(<DentikOSMicroSeal />)
    const seal = screen.getByTestId('dentikos-micro-seal')
    expect(seal).toBeInTheDocument()
  })

  it('renderiza el glifo del molar con tamaño 14x14 y trazo áureo #B88E3A', () => {
    render(<DentikOSMicroSeal />)
    const svg = screen.getByRole('img', { name: /dentikos molar glyph/i })
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '14')
    expect(svg).toHaveAttribute('height', '14')

    const path = screen.getByTestId('dentikos-molar-glyph')
    expect(path).toHaveAttribute('stroke', '#B88E3A')
  })

  it('renderiza el wordmark "Dentik" y "OS" en oro', () => {
    render(<DentikOSMicroSeal />)
    expect(screen.getByText('Dentik')).toBeInTheDocument()
    expect(screen.getByText('OS')).toBeInTheDocument()
    expect(screen.getByText('OS')).toHaveClass('text-[#B88E3A]')
  })

  it('renderiza la leyenda normativa oficial conforme a Ley 20.584 y Ley 19.628', () => {
    render(<DentikOSMicroSeal />)
    expect(
      screen.getByText(/Trazabilidad Firma Digital — Powered by DentikOS • Ficha clínica electrónica conforme a Ley 20.584 y Ley 19.628/i)
    ).toBeInTheDocument()
  })

  it('permite aplicar clases personalizadas', () => {
    render(<DentikOSMicroSeal className="custom-test-class" />)
    expect(screen.getByTestId('dentikos-micro-seal')).toHaveClass('custom-test-class')
  })
})
