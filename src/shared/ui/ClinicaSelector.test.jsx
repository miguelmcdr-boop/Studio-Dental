import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClinicaSelector } from './ClinicaSelector'

// Mock completo de authService antes de importar el componente
vi.mock('../../infrastructure/auth/authService', () => ({
  listarMisClinicas: vi.fn(),
  setClinicaActiva: vi.fn(),
  getClinicaActiva: vi.fn(),
  getClinicaActivaSync: vi.fn().mockReturnValue('clinica-test')
}))

vi.mock('../../infrastructure/supabase/invalidarCacheCambioClinica', () => ({
  invalidarCacheCambioClinica: vi.fn().mockResolvedValue({
    tenantKeys: 5,
    storageServices: 4,
    stores: ['pacientesStore', 'prestacionesStore'],
    legacyKeys: 3,
    indexedDB: { eliminada: true },
    errores: 0
  })
}))

vi.mock('../../infrastructure/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  })
}))

// Importar después de mockear
import * as authService from '../../infrastructure/auth/authService'
import * as invalidarModule from '../../infrastructure/supabase/invalidarCacheCambioClinica'

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

  it('F7-36: debe llamar a invalidarCacheCambioClinica cuando el usuario cambia clínica', async () => {
    // Setup: 2 clínicas, una activa
    vi.mocked(authService.listarMisClinicas).mockResolvedValue([
      { clinica_id: 'clinica-A', nombre: 'Clínica A', rol: 'dentista' },
      { clinica_id: 'clinica-B', nombre: 'Clínica B', rol: 'dentista' }
    ])
    vi.mocked(authService.getClinicaActiva).mockResolvedValue('clinica-A')
    vi.mocked(authService.setClinicaActiva).mockResolvedValue({ success: true })

    // Renderizar
    render(<ClinicaSelector />)
    await new Promise(resolve => setTimeout(resolve, 10))

    // El usuario cambia a clínica B
    const select = screen.getByRole('combobox', { name: /clínica activa/i })
    Object.defineProperty(select, 'value', { value: 'clinica-B', writable: true })
    select.dispatchEvent(new Event('change', { bubbles: true }))

    // Esperar que se procese el cambio
    await new Promise(resolve => setTimeout(resolve, 50))

    // Debe llamar a invalidarCacheCambioClinica con la clínica anterior
    expect(invalidarModule.invalidarCacheCambioClinica).toHaveBeenCalledWith('clinica-A')
  })

})
