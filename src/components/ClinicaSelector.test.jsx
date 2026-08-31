import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClinicaSelector } from './ClinicaSelector'

// Mock completo de authService antes de importar el componente
vi.mock('../services/authService', () => ({
  listarMisClinicas: vi.fn(),
  setClinicaActiva: vi.fn(),
  getClinicaActiva: vi.fn()
}))

vi.mock('../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  })
}))

// Importar después de mockear
import * as authService from '../services/authService'

describe('ClinicaSelector (F7-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar el componente sin errores', () => {
    vi.mocked(authService.listarMisClinicas).mockResolvedValue([])
    vi.mocked(authService.getClinicaActiva).mockResolvedValue(null)

    const { container } = render(<ClinicaSelector />)
    expect(container).toBeTruthy()
  })

  it('debe llamar a listarMisClinicas al montar', async () => {
    vi.mocked(authService.listarMisClinicas).mockResolvedValue([])
    vi.mocked(authService.getClinicaActiva).mockResolvedValue(null)

    render(<ClinicaSelector />)
    
    // Esperar un tick para que se ejecute useEffect
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(authService.listarMisClinicas).toHaveBeenCalled()
  })

  it('debe llamar a getClinicaActiva al montar', async () => {
    vi.mocked(authService.listarMisClinicas).mockResolvedValue([])
    vi.mocked(authService.getClinicaActiva).mockResolvedValue(null)

    render(<ClinicaSelector />)
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(authService.getClinicaActiva).toHaveBeenCalled()
  })

  it('debe exportar el componente correctamente', () => {
    expect(ClinicaSelector).toBeDefined()
    expect(typeof ClinicaSelector).toBe('function')
  })

  it('debe aceptar prop onCambioClinica como función', () => {
    const mockCallback = vi.fn()
    vi.mocked(authService.listarMisClinicas).mockResolvedValue([])
    vi.mocked(authService.getClinicaActiva).mockResolvedValue(null)

    const { container } = render(<ClinicaSelector onCambioClinica={mockCallback} />)
    expect(container).toBeTruthy()
  })

  it('debe aceptar prop onCambioClinica como undefined', () => {
    vi.mocked(authService.listarMisClinicas).mockResolvedValue([])
    vi.mocked(authService.getClinicaActiva).mockResolvedValue(null)

    const { container } = render(<ClinicaSelector onCambioClinica={undefined} />)
    expect(container).toBeTruthy()
  })
})
