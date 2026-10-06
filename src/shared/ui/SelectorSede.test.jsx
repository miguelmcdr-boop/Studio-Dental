import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectorSede } from './SelectorSede'

vi.mock('../../domains/organization/clinic/hooks/useSedes', () => ({
  useSedes: vi.fn(),
}))

vi.mock('../../app/stores/sesionStore', () => ({
  useSesionStore: vi.fn(() => vi.fn()),
}))

import { useSedes } from '../../domains/organization/clinic/hooks/useSedes'

describe('SelectorSede', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no renderiza nada si no hay sedes', () => {
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

    const { container } = render(<SelectorSede />)
    expect(container.firstChild).toBeNull()
  })

  it('muestra etiqueta fija si solo hay 1 sede', () => {
    vi.mocked(useSedes).mockReturnValue({
      sedes: [{ id: 'sede-1', nombre: 'Sede Principal', direccion: 'Calle 1', comuna: 'C', region: 'R', activa: true }],
      sedeActiva: { id: 'sede-1', nombre: 'Sede Principal', direccion: 'Calle 1', comuna: 'C', region: 'R', activa: true },
      sedeActivaId: 'sede-1',
      cambiarSede: vi.fn(),
      agregarSede: vi.fn(),
      editarSede: vi.fn(),
      eliminarSede: vi.fn(),
      recargar: vi.fn(),
    })

    render(<SelectorSede />)
    expect(screen.getByText('Sede Principal')).toBeInTheDocument()
  })

  it('muestra selector interactivo si hay múltiples sedes', () => {
    const cambiarSedeMock = vi.fn()
    vi.mocked(useSedes).mockReturnValue({
      sedes: [
        { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'R', activa: true },
        { id: 'sede-2', nombre: 'Sede Las Condes', direccion: 'Av. Las Condes', comuna: 'C', region: 'R', activa: true },
      ],
      sedeActiva: { id: 'sede-1', nombre: 'Sede Providencia', direccion: 'Av. Providencia', comuna: 'C', region: 'R', activa: true },
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
})
