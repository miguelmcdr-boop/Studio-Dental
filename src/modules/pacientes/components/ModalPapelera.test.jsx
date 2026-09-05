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

  // === Tests Feature 1: vaciar papelera ===

  it('muestra botón Vaciar papelera cuando puedeVaciar=true y hay elegibles', () => {
    render(
      <ModalPapelera 
        {...defaultProps} 
        puedeVaciar={true} 
        contadorElegibles={2}
        aniosRetencion={10}
      />
    )
    
    expect(screen.getByText(/Vaciar papelera/)).toBeInTheDocument()
    // La advertencia específica de retención debe aparecer
    expect(screen.getByText(/Solo puedes eliminar permanentemente/)).toBeInTheDocument()
    expect(screen.getByText(/Pacientes elegibles para purga/)).toBeInTheDocument()
  })

  it('NO muestra sección de acciones admin cuando puedeVaciar=false', () => {
    render(
      <ModalPapelera 
        {...defaultProps} 
        puedeVaciar={false}
        contadorElegibles={2}
      />
    )
    
    // El botón Vaciar no debe aparecer
    expect(screen.queryByText(/Vaciar papelera/)).not.toBeInTheDocument()
    // La advertencia específica de retención tampoco
    expect(screen.queryByText(/Solo puedes eliminar permanentemente/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Pacientes elegibles para purga/)).not.toBeInTheDocument()
    // Nota: el footer SIEMPRE menciona Ley 20.584, eso es correcto
  })

  it('botón Vaciar está deshabilitado cuando contadorElegibles=0', () => {
    render(
      <ModalPapelera 
        {...defaultProps} 
        puedeVaciar={true} 
        contadorElegibles={0}
      />
    )
    
    const boton = screen.getByText(/Vaciar papelera/)
    expect(boton).toBeDisabled()
  })

  it('abre modal de confirmación al hacer click en Vaciar papelera', () => {
    render(
      <ModalPapelera 
        {...defaultProps} 
        puedeVaciar={true} 
        contadorElegibles={2}
      />
    )
    
    const boton = screen.getByText(/Vaciar papelera/)
    fireEvent.click(boton)
    
    expect(screen.getByText(/Eliminación permanente/)).toBeInTheDocument()
    expect(screen.getByText(/IRREVERSIBLE/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ELIMINAR')).toBeInTheDocument()
  })

  it('botón confirmar está deshabilitado hasta escribir "ELIMINAR"', () => {
    render(
      <ModalPapelera 
        {...defaultProps} 
        puedeVaciar={true} 
        contadorElegibles={2}
      />
    )
    
    fireEvent.click(screen.getByText(/Vaciar papelera/))
    
    const botonConfirmar = screen.getByText(/Eliminar permanentemente/)
    expect(botonConfirmar).toBeDisabled()
    
    const input = screen.getByPlaceholderText('ELIMINAR')
    fireEvent.change(input, { target: { value: 'ELIMINAR' } })
    
    expect(botonConfirmar).not.toBeDisabled()
  })

  it('llama onVaciar al confirmar con texto "ELIMINAR"', async () => {
    const onVaciar = vi.fn().mockResolvedValue({ purgados: ['1'], rechazados: [] })
    render(
      <ModalPapelera 
        {...defaultProps} 
        puedeVaciar={true} 
        contadorElegibles={1}
        onVaciar={onVaciar}
      />
    )
    
    fireEvent.click(screen.getByText(/Vaciar papelera/))
    fireEvent.change(screen.getByPlaceholderText('ELIMINAR'), { target: { value: 'ELIMINAR' } })
    fireEvent.click(screen.getByText(/Eliminar permanentemente/))
    
    await waitFor(() => {
      expect(onVaciar).toHaveBeenCalled()
    })
  })

  it('NO llama onVaciar con texto incorrecto', () => {
    const onVaciar = vi.fn()
    render(
      <ModalPapelera 
        {...defaultProps} 
        puedeVaciar={true} 
        contadorElegibles={1}
        onVaciar={onVaciar}
      />
    )
    
    fireEvent.click(screen.getByText(/Vaciar papelera/))
    fireEvent.change(screen.getByPlaceholderText('ELIMINAR'), { target: { value: 'incorrecto' } })
    
    const botonConfirmar = screen.getByText(/Eliminar permanentemente/)
    expect(botonConfirmar).toBeDisabled()
    expect(onVaciar).not.toHaveBeenCalled()
  })

  it('cierra modal de confirmación al hacer click en Cancelar', () => {
    render(
      <ModalPapelera 
        {...defaultProps} 
        puedeVaciar={true} 
        contadorElegibles={2}
      />
    )
    
    fireEvent.click(screen.getByText(/Vaciar papelera/))
    expect(screen.getByText(/Eliminación permanente/)).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Cancelar'))
    
    expect(screen.queryByText(/Eliminación permanente/)).not.toBeInTheDocument()
  })
})
