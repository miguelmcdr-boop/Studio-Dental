import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { PapeleraArchivos } from './PapeleraArchivos'

describe('PapeleraArchivos (F7-31 + Feature 1)', () => {
  const mockArchivos = [
    {
      id: '1',
      nombre_archivo: 'foto_clinica.jpg',
      categoria: 'foto_clinica',
      deleted_at: '2026-08-20T10:00:00Z',
      tamano_bytes: 1024 * 500,
    },
    {
      id: '2',
      nombre_archivo: 'radiografia.png',
      categoria: 'radiografia',
      deleted_at: '2026-08-21T15:30:00Z',
      tamano_bytes: 1024 * 1024 * 2,
    },
  ]

  const defaultProps = {
    archivosEliminados: mockArchivos,
    cargando: false,
    onRestaurar: vi.fn(),
    onVaciar: vi.fn(),
    puedeVaciar: false,
    permisos: { puedeEliminar: true },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === Tests básicos (F7-31) ===

  it('renderiza sección colapsada con contador', () => {
    render(<PapeleraArchivos {...defaultProps} />)

    expect(screen.getByText(/Papelera de Reciclaje/)).toBeInTheDocument()
    expect(screen.getByText(/2 archivos/)).toBeInTheDocument()
    expect(screen.getByText(/Mostrar/)).toBeInTheDocument()
  })

  it('NO renderiza si permisos.puedeEliminar=false', () => {
    render(<PapeleraArchivos {...defaultProps} permisos={{ puedeEliminar: false }} />)

    expect(screen.queryByText(/Papelera de Reciclaje/)).not.toBeInTheDocument()
  })

  it('muestra lista de archivos al abrir', () => {
    render(<PapeleraArchivos {...defaultProps} />)

    fireEvent.click(screen.getByText(/Mostrar/))

    expect(screen.getByText('foto_clinica.jpg')).toBeInTheDocument()
    expect(screen.getByText('radiografia.png')).toBeInTheDocument()
    expect(screen.getAllByText(/Eliminado el/)).toHaveLength(2)
  })

  it('muestra estado vacío si no hay archivos', () => {
    render(<PapeleraArchivos {...defaultProps} archivosEliminados={[]} />)

    fireEvent.click(screen.getByText(/Mostrar/))

    expect(screen.getByText(/La papelera está vacía/)).toBeInTheDocument()
  })

  it('muestra estado de carga', () => {
    render(<PapeleraArchivos {...defaultProps} cargando={true} />)

    fireEvent.click(screen.getByText(/Mostrar/))

    expect(screen.getByText(/Cargando papelera/)).toBeInTheDocument()
  })

  // === Tests Feature 1: vaciar papelera ===

  it('muestra botón Vaciar papelera cuando puedeVaciar=true y hay archivos', () => {
    render(<PapeleraArchivos {...defaultProps} puedeVaciar={true} />)

    expect(screen.getByText(/Vaciar papelera/)).toBeInTheDocument()
  })

  it('NO muestra botón Vaciar papelera cuando puedeVaciar=false', () => {
    render(<PapeleraArchivos {...defaultProps} puedeVaciar={false} />)

    expect(screen.queryByText(/Vaciar papelera/)).not.toBeInTheDocument()
  })

  it('NO muestra botón Vaciar papelera si no hay archivos', () => {
    render(<PapeleraArchivos {...defaultProps} puedeVaciar={true} archivosEliminados={[]} />)

    expect(screen.queryByText(/Vaciar papelera/)).not.toBeInTheDocument()
  })

  it('abre modal de confirmación al hacer click en Vaciar papelera', () => {
    render(<PapeleraArchivos {...defaultProps} puedeVaciar={true} />)

    fireEvent.click(screen.getByText(/Vaciar papelera/))

    expect(screen.getByText(/Vaciar papelera de archivos/)).toBeInTheDocument()
    expect(screen.getByText(/IRREVERSIBLE/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('VACIAR')).toBeInTheDocument()
  })

  it('botón confirmar está deshabilitado hasta escribir "VACIAR"', () => {
    render(<PapeleraArchivos {...defaultProps} puedeVaciar={true} />)

    fireEvent.click(screen.getByText(/Vaciar papelera/))

    const modal = screen.getByText(/Vaciar papelera de archivos/).closest('div')
    const botonConfirmar = within(modal).getByRole('button', { name: /Vaciar papelera/ })
    expect(botonConfirmar).toBeDisabled()

    const input = within(modal).getByPlaceholderText('VACIAR')
    fireEvent.change(input, { target: { value: 'VACIAR' } })

    expect(botonConfirmar).not.toBeDisabled()
  })

  it('llama onVaciar al confirmar con texto "VACIAR"', async () => {
    const onVaciar = vi.fn().mockResolvedValue({ purgados: ['1', '2'], rechazados: [] })
    render(<PapeleraArchivos {...defaultProps} puedeVaciar={true} onVaciar={onVaciar} />)

    fireEvent.click(screen.getByText(/Vaciar papelera/))

    const modal = screen.getByText(/Vaciar papelera de archivos/).closest('div')
    fireEvent.change(within(modal).getByPlaceholderText('VACIAR'), { target: { value: 'VACIAR' } })
    fireEvent.click(within(modal).getByRole('button', { name: /Vaciar papelera/ }))

    await waitFor(() => {
      expect(onVaciar).toHaveBeenCalled()
    })
  })

  it('NO llama onVaciar con texto incorrecto', () => {
    const onVaciar = vi.fn()
    render(<PapeleraArchivos {...defaultProps} puedeVaciar={true} onVaciar={onVaciar} />)

    fireEvent.click(screen.getByText(/Vaciar papelera/))

    const modal = screen.getByText(/Vaciar papelera de archivos/).closest('div')
    fireEvent.change(within(modal).getByPlaceholderText('VACIAR'), { target: { value: 'incorrecto' } })

    const botonConfirmar = within(modal).getByRole('button', { name: /Vaciar papelera/ })
    expect(botonConfirmar).toBeDisabled()
    expect(onVaciar).not.toHaveBeenCalled()
  })

  it('cierra modal de confirmación al hacer click en Cancelar', () => {
    render(<PapeleraArchivos {...defaultProps} puedeVaciar={true} />)

    fireEvent.click(screen.getByText(/Vaciar papelera/))
    expect(screen.getByText(/Vaciar papelera de archivos/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancelar'))

    expect(screen.queryByText(/Vaciar papelera de archivos/)).not.toBeInTheDocument()
  })

  it('formato de tamaño en MB', () => {
    render(<PapeleraArchivos {...defaultProps} />)

    fireEvent.click(screen.getByText(/Mostrar/))

    expect(screen.getByText(/2.0 MB/)).toBeInTheDocument()
  })
})
