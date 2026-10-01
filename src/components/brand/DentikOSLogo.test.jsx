import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DentikOSLogo } from './DentikOSLogo'

describe('DentikOSLogo (Identidad Visual)', () => {
  it('renderiza la variante horizontal por defecto con isotipo y wordmark', () => {
    render(<DentikOSLogo />)
    expect(screen.getByText('Dentik')).toBeInTheDocument()
    expect(screen.getByText('OS')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /DentikOS Logo/i })).toBeInTheDocument()
  })

  it('renderiza la variante icon-only sin texto del wordmark', () => {
    render(<DentikOSLogo variant="icon-only" />)
    expect(screen.queryByText('Dentik')).not.toBeInTheDocument()
    expect(screen.queryByText('OS')).not.toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('renderiza la variante stacked con isotipo y texto', () => {
    render(<DentikOSLogo variant="stacked" />)
    expect(screen.getByText('Dentik')).toBeInTheDocument()
    expect(screen.getByText('OS')).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('contiene el path anatómico oficial del molar en el SVG', () => {
    render(<DentikOSLogo />)
    const path = screen.getByTestId('dentikos-molar-path')
    expect(path).toBeInTheDocument()
    expect(path.getAttribute('d')).toContain('M 18 36 C 18 16')
    expect(path.getAttribute('stroke')).toBe('url(#dentikosGoldOfficial)')
  })

  it('aplica el strokeWidth correcto según opticalSize', () => {
    const { rerender } = render(<DentikOSLogo opticalSize="micro" />)
    let path = screen.getByTestId('dentikos-molar-path')
    expect(path.getAttribute('stroke-width')).toBe('10')

    rerender(<DentikOSLogo opticalSize="standard" />)
    path = screen.getByTestId('dentikos-molar-path')
    expect(path.getAttribute('stroke-width')).toBe('7.5')

    rerender(<DentikOSLogo opticalSize="display" />)
    path = screen.getByTestId('dentikos-molar-path')
    expect(path.getAttribute('stroke-width')).toBe('5.5')
  })

  it('soporta prop dark para forzar texto blanco', () => {
    render(<DentikOSLogo dark={true} />)
    const dentikWord = screen.getByText('Dentik')
    expect(dentikWord.className).toContain('text-white')
  })

  it('soporta tamaños numéricos y predefinidos', () => {
    const { rerender } = render(<DentikOSLogo size="lg" />)
    let svg = screen.getByRole('img')
    expect(svg.getAttribute('width')).toBe('48')

    rerender(<DentikOSLogo size={32} />)
    svg = screen.getByRole('img')
    expect(svg.getAttribute('width')).toBe('32')
  })
})
