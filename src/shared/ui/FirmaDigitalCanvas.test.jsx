import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FirmaDigitalCanvas } from './FirmaDigitalCanvas'

describe('FirmaDigitalCanvas - 3 Modos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn(),
    })
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mocksignature')
  })

  it('renderiza con selector de 3 modos: Dibujar, Subir, Escribir', () => {
    render(<FirmaDigitalCanvas />)

    expect(screen.getByText('Dibujar')).toBeInTheDocument()
    expect(screen.getByText('Subir')).toBeInTheDocument()
    expect(screen.getByText('Escribir')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /limpiar firma/i })).toBeInTheDocument()
  })

  it('permite cambiar a modo subir imagen', () => {
    render(<FirmaDigitalCanvas />)
    fireEvent.click(screen.getByText('Subir'))

    expect(screen.getByText(/seleccionar imagen de tu firma/i)).toBeInTheDocument()
  })

  it('permite cambiar a modo tipográfica con estilos', () => {
    render(<FirmaDigitalCanvas />)
    fireEvent.click(screen.getByText('Escribir'))

    expect(screen.getByPlaceholderText(/escribe tu nombre/i)).toBeInTheDocument()
    expect(screen.getByText('elegante')).toBeInTheDocument()
    expect(screen.getByText('moderno')).toBeInTheDocument()
    expect(screen.getByText('clasico')).toBeInTheDocument()
  })
})
