import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from './Sidebar'
import { useRBAC } from '../hooks/useRBAC'
import { ROLES, PERMISOS } from '../../constants/rbacConstants'

vi.mock('../hooks/useRBAC', () => ({
  useRBAC: vi.fn(),
}))

describe('Sidebar - Matriz de Permisos Blueprint 02', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Recepcionista: solo ve 4 módulos básicos (Dashboard, Agenda, Pacientes, Comunicaciones)', () => {
    vi.mocked(useRBAC).mockReturnValue({
      rol: ROLES.RECEPCION,
      esAdmin: false,
      puede: vi.fn().mockReturnValue(false),
      tieneAlguno: vi.fn().mockReturnValue(false),
      es: vi.fn((r) => r === ROLES.RECEPCION),
      permisos: [],
    })

    render(<Sidebar activeSection="Dashboard" setActiveSection={vi.fn()} />)

    expect(screen.getByTestId('sidebar-menu-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-menu-agenda')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-menu-pacientes')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-menu-comunicaciones')).toBeInTheDocument()

    // Opciones no permitidas no deben aparecer
    expect(screen.queryByTestId('sidebar-menu-presupuestos')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-menu-admin')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-menu-inventario')).not.toBeInTheDocument()
  })

  it('Admin: tiene visible el módulo Administración DentikOS', () => {
    vi.mocked(useRBAC).mockReturnValue({
      rol: ROLES.ADMIN,
      esAdmin: true,
      puede: vi.fn().mockReturnValue(true),
      tieneAlguno: vi.fn().mockReturnValue(true),
      es: vi.fn((r) => r === ROLES.ADMIN),
      permisos: Object.values(PERMISOS),
    })

    render(<Sidebar activeSection="Dashboard" setActiveSection={vi.fn()} />)

    expect(screen.getByTestId('sidebar-menu-admin')).toBeInTheDocument()
  })

  it('Dentista: no ve Administración DentikOS pero sí ve módulos clínicos y financieros', () => {
    vi.mocked(useRBAC).mockReturnValue({
      rol: ROLES.DENTISTA,
      esAdmin: false,
      puede: vi.fn((p) => p !== PERMISOS.GESTIONAR_USUARIOS && p !== PERMISOS.VER_CONFIGURACION),
      tieneAlguno: vi.fn().mockReturnValue(true),
      es: vi.fn((r) => r === ROLES.DENTISTA),
      permisos: [],
    })

    render(<Sidebar activeSection="Dashboard" setActiveSection={vi.fn()} />)

    expect(screen.getByTestId('sidebar-menu-pagos')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-menu-vademecum')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-menu-admin')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-menu-presupuestos')).not.toBeInTheDocument()
  })
})
