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

  it('muestra fallback "Sede Principal" si no hay sedes registradas', () => {
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

    render(<SelectorSede />)
    expect(screen.getByTestId('selector-sede')).toBeInTheDocument()
    expect(screen.getByText('Sede Principal')).toBeInTheDocument()
  })

  it('con 1 sede: pill visible con nombre y combobox interactivo', () => {
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

    render(<SelectorSede compacto />)
    expect(screen.getByTestId('selector-sede')).toBeInTheDocument()
    expect(screen.getByText('Sede Providencia')).toBeInTheDocument()
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('sede-1')
  })

  it('con múltiples sedes: selector interactivo permite cambiar de sede', () => {
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
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Sede Providencia')).toBeInTheDocument()
    expect(screen.getByText('Sede Las Condes')).toBeInTheDocument()

    fireEvent.change(select, { target: { value: 'sede-2' } })
    expect(cambiarSedeMock).toHaveBeenCalledWith('sede-2')
  })

  it('estado sincronizado (default): pill limpia SIN punto indicador verde', () => {
    vi.mocked(useSedes).mockReturnValue({
      sedes: [{ id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'RM', activa: true }],
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

  it('estado no sincronizado (sincronizado=false): muestra punto indicador ámbar de cambio pendiente', () => {
    vi.mocked(useSedes).mockReturnValue({
      sedes: [{ id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'RM', activa: true }],
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
    expect(contenedor).toHaveAttribute('aria-label', 'Cambio pendiente')
    const punto = screen.getByTestId('selector-sede-status')
    expect(punto).toBeInTheDocument()
    expect(punto).toHaveClass('bg-amber-400')
    expect(punto).toHaveAttribute('aria-label', 'Cambio pendiente')
  })
})
