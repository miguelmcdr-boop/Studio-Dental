/**
 * Tests de Tooth (F10-B1): compatibilidad con la API de <Icon>
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { Icon } from '../Icon'
import { Tooth } from './Tooth'

describe('Tooth (F10-B1)', () => {
  it('renderiza vía <Icon> con size sm (16px)', () => {
    const { container } = render(<Icon icon={Tooth} size="sm" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('16')
    expect(svg.getAttribute('height')).toBe('16')
  })

  it('renderiza vía <Icon> con size md por defecto (20px)', () => {
    const { container } = render(<Icon icon={Tooth} />)
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('width')).toBe('20')
  })

  it('aplica color del design system como stroke', () => {
    const { container } = render(<Icon icon={Tooth} color="primary" />)
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('stroke')).toBe('var(--color-primary)')
  })

  it('aplica strokeWidth pasado por <Icon>', () => {
    const { container } = render(<Icon icon={Tooth} />)
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('stroke-width')).toBe('1.75')
  })

  it('renderiza standalone con aria-hidden (decorativo)', () => {
    const { container } = render(<Tooth size={24} />)
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
  })
})
