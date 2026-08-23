import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModalPapelera } from './ModalPapelera'

describe('ModalPapelera (F6-L)', () => {
  const mockPacientes = [
    { 
      id: '1', 
      nombre: 'Juan Pérez', 
      rut: '12345678-9', 
      deleted_at: '2026-08-20T10:00:00Z',
      eliminadoPor: 'admin@clinica.com'
    },
    { 
      id: '2', 
      nombre: 'María González', 
      rut: '98765432-1', 
      deleted_at: '2026-08-21T15:30:00Z',
      eliminadoPor: 'recepcion@clinica.com'
    }
  ]

  const defaultProps = {
    pacientesEliminados: mockPacientes,
    cargando: false,
    onRestaurar: vi.fn(),
    onCerrar: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('renderiza lista de pacientes eliminados', () => {
    render(<ModalPapelera {...defaultProps} />)
    
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('María González')).toBeInTheDocument()
    expect(screen.getByText(/12345678-9/)).toBeInTheDocument()
    expect(screen.getByText(/98765432-1/)).toBeInTheDocument()
  })

  it('muestra contador de pacientes eliminados', () => {
    render(<ModalPapelera {...defaultProps} />)
    
    expect(screen.getByText(/2 pacientes eliminados/)).toBeInTheDocument()
  })

  it('filtra pacientes por búsqueda de nombre', () => {
    render(<ModalPapelera {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/Buscar por nombre o RUT/)
    fireEvent.change(input, { target: { value: 'Juan' } })
    
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.queryByText('María González')).not.toBeInTheDocument()
  })

  it('filtra pacientes por búsqueda de RUT', () => {
    render(<ModalPapelera {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/Buscar por nombre o RUT/)
    fireEvent.change(input, { target: { value: '98765432' } })
    
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
    expect(screen.getByText('María González')).toBeInTheDocument()
  })

  it('llama onRestaurar al hacer clic en botón restaurar', async () => {
    const onRestaurar = vi.fn().mockResolvedValue(true)
    render(<ModalPapelera {...defaultProps} onRestaurar={onRestaurar} />)
    
    const botonesRestaurar = screen.getAllByText(/Restaurar/)
    fireEvent.click(botonesRestaurar[0])
    
    expect(window.confirm).toHaveBeenCalled()
    
    await waitFor(() => {
      expect(onRestaurar).toHaveBeenCalledWith('1')
    })
  })

  it('no llama onRestaurar si usuario cancela confirmación', async () => {
    window.confirm.mockReturnValue(false)
    const onRestaurar = vi.fn()
    render(<ModalPapelera {...defaultProps} onRestaurar={onRestaurar} />)
    
    const botonesRestaurar = screen.getAllByText(/Restaurar/)
    fireEvent.click(botonesRestaurar[0])
    
    expect(onRestaurar).not.toHaveBeenCalled()
  })

  it('muestra estado de carga', () => {
    render(<ModalPapelera {...defaultProps} cargando={true} />)
    
    expect(screen.getByText(/Cargando papelera/)).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay pacientes', () => {
    render(<ModalPapelera {...defaultProps} pacientesEliminados={[]} />)
    
    expect(screen.getByText(/La papelera está vacía/)).toBeInTheDocument()
  })

  it('muestra mensaje de no resultados en búsqueda', () => {
    render(<ModalPapelera {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/Buscar por nombre o RUT/)
    fireEvent.change(input, { target: { value: 'NoExiste' } })
    
    expect(screen.getByText(/No se encontraron pacientes/)).toBeInTheDocument()
  })

  it('cierra modal al hacer clic en botón cerrar', () => {
    render(<ModalPapelera {...defaultProps} />)
    
    const botonCerrar = screen.getByText('✕')
    fireEvent.click(botonCerrar)
    
    expect(defaultProps.onCerrar).toHaveBeenCalled()
  })
})
