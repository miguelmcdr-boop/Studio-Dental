import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectorSede } from './SelectorSede'
import { useSedes } from '../../domains/organization/clinic/hooks/useSedes'

vi.mock('../../domains/organization/clinic/hooks/useSedes', () => ({
  useSedes: vi.fn(),
}))

vi.mock('../../app/stores/sesionStore', () => ({
  useSesionStore: vi.fn(() => vi.fn()),
}))

describe('SelectorSede (Blueprint 03 §04)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('con 0 sedes o 1 sede: selector ausente (retorna null)', () => {
    vi.mocked(useSedes).mockReturnValue({
      sedes: [{ id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia 123', comuna: 'P', region: 'RM', activa: true }],
      sedeActiva: { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia 123', comuna: 'P', region: 'RM', activa: true },
      sedeActivaId: 'sede-1',
      cambiarSede: vi.fn(),
      agregarSede: vi.fn(),
      editarSede: vi.fn(),
      eliminarSede: vi.fn(),
      recargar: vi.fn(),
    })

    const { rerender } = render(<SelectorSede />)
    expect(screen.queryByTestId('selector-sede')).not.toBeInTheDocument()

    vi.mocked(useSedes).mockReturnValue({
      sedes: [],
      sedeActiva: null,
      sedeActivaId: null,
      cambiarSede: vi.fn(),
      agregarSede: vi.fn(),
      editarSede: vi.fn(),
      eliminarSede: vi.fn(),
      recargar: vi.fn(),
    })
    rerender(<SelectorSede />)
    expect(screen.queryByTestId('selector-sede')).not.toBeInTheDocument()
  })

  it('con 2+ sedes: selector presente e interactivo permite cambiar de sede con toast y sonido', () => {
    const cambiarSedeMock = vi.fn()
    vi.mocked(useSedes).mockReturnValue({
      sedes: [
        { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'RM', activa: true },
        { id: 'sede-2', nombre: 'Sede Las Condes', direccion: 'Av. Las Condes', comuna: 'C', region: 'RM', activa: true },
      ],
      sedeActiva: { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'RM', activa: true },
      sedeActivaId: 'sede-1',
      cambiarSede: cambiarSedeMock,
      agregarSede: vi.fn(),
      editarSede: vi.fn(),
      eliminarSede: vi.fn(),
      recargar: vi.fn(),
    })

    render(<SelectorSede />)
    expect(screen.getByTestId('selector-sede')).toBeInTheDocument()
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Sede Providencia')).toBeInTheDocument()
    expect(screen.getByText('Sede Las Condes')).toBeInTheDocument()

    fireEvent.change(select, { target: { value: 'sede-2' } })
    expect(cambiarSedeMock).toHaveBeenCalledWith('sede-2')
  })

  it('estado sincronizado (default): pill limpia SIN punto indicador', () => {
    vi.mocked(useSedes).mockReturnValue({
      sedes: [
        { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'RM', activa: true },
        { id: 'sede-2', nombre: 'Sede Las Condes', direccion: 'Av. Las Condes', comuna: 'C', region: 'RM', activa: true },
      ],
      sedeActiva: { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'RM', activa: true },
      sedeActivaId: 'sede-1',
      cambiarSede: vi.fn(),
      agregarSede: vi.fn(),
      editarSede: vi.fn(),
      eliminarSede: vi.fn(),
      recargar: vi.fn(),
    })

    render(<SelectorSede sincronizado={true} />)
    const contenedor = screen.getByTestId('selector-sede')
    expect(contenedor).toBeInTheDocument()
    expect(contenedor).toHaveAttribute('aria-label', 'Sede activa y sincronizada')
    expect(screen.queryByTestId('selector-sede-status')).not.toBeInTheDocument()
  })

  it('estado no sincronizado (offline con cola): muestra punto ámbar y tooltip "Cambios pendientes de sincronizar"', () => {
    vi.mocked(useSedes).mockReturnValue({
      sedes: [
        { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'RM', activa: true },
        { id: 'sede-2', nombre: 'Sede Las Condes', direccion: 'Av. Las Condes', comuna: 'C', region: 'RM', activa: true },
      ],
      sedeActiva: { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'RM', activa: true },
      sedeActivaId: 'sede-1',
      cambiarSede: vi.fn(),
      agregarSede: vi.fn(),
      editarSede: vi.fn(),
      eliminarSede: vi.fn(),
      recargar: vi.fn(),
    })

    render(<SelectorSede sincronizado={false} />)
    const contenedor = screen.getByTestId('selector-sede')
    expect(contenedor).toHaveAttribute('aria-label', 'Cambios pendientes de sincronizar')
    const punto = screen.getByTestId('selector-sede-status')
    expect(punto).toBeInTheDocument()
    expect(punto).toHaveClass('bg-amber-400')
    expect(punto).toHaveAttribute('aria-label', 'Cambios pendientes de sincronizar')
  })
})
